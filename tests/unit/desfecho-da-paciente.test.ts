import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PP-03A — A ACTION DO DESFECHO DELA.
 *
 * O que estes testes protegem é a fronteira: a action da paciente NÃO reutiliza
 * a do Curador (que exige papel interno — o defeito que o PP-03 nomeia), não
 * escreve em tabela nenhuma, e não duplica a regra do DT-22 como se fosse dona
 * dela. Toda a autoridade vive na RPC; aqui só passa quem é paciente
 * autenticada, e os retornos nomeados viram frases que falam com ela.
 */

const mocks = vi.hoisted(() => ({
  requireRoleForAction: vi.fn(),
  rpc: vi.fn(),
}));

class NaoAutenticadoFake extends Error {}

vi.mock("@/modules/auth/guard", () => ({
  requireRoleForAction: mocks.requireRoleForAction,
  NaoAutenticadoError: NaoAutenticadoFake,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ rpc: mocks.rpc }),
}));

const { registrarDesfechoAction } = await import("@/modules/paciente/desfecho-actions");

const CASE_ID = "11111111-1111-4111-8111-111111111111";

const BASE = {
  caseId: CASE_ID,
  subcriterionCode: "MODELO_COMUNICACAO",
  acknowledgment: "CORRIGIDA" as const,
  correction: "não foi bem isso",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireRoleForAction.mockResolvedValue(undefined);
  mocks.rpc.mockResolvedValue({ data: "CORRIGIDA", error: null });
});

describe("A porta: só ela pratica o próprio ato", () => {
  it("exige o papel de paciente — nunca o do Curador", async () => {
    await registrarDesfechoAction(BASE);
    expect(mocks.requireRoleForAction).toHaveBeenCalledWith("paciente");
  });

  it("sessão expirada é reentrada, nunca acusação de posse", async () => {
    mocks.requireRoleForAction.mockRejectedValue(new NaoAutenticadoFake("expirou"));

    const resultado = await registrarDesfechoAction(BASE);

    expect(resultado).toEqual({
      success: false,
      code: "SESSAO_EXPIRADA",
      error: "Sua sessão expirou. Entre novamente para continuar.",
    });
  });

  it("autenticada sem o papel: aí sim o Perfil não é dela", async () => {
    mocks.requireRoleForAction.mockRejectedValue(new Error("papel errado"));

    const resultado = await registrarDesfechoAction(BASE);

    expect(resultado).toEqual({ success: false, error: "Este Perfil não é seu." });
  });

  it("o guarda vem ANTES da validação — payload inválido de estranho não vaza formato", async () => {
    mocks.requireRoleForAction.mockRejectedValue(new Error("papel errado"));

    await registrarDesfechoAction({ lixo: true });

    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("DT-22 · o texto dela", () => {
  it("CORRIGIDA e RECUSADA sem texto são recusadas com a própria frase", async () => {
    for (const desfecho of ["CORRIGIDA", "RECUSADA"]) {
      const resultado = await registrarDesfechoAction({
        ...BASE,
        acknowledgment: desfecho,
        correction: "   ",
      });

      expect(resultado.success, desfecho).toBe(false);
      expect((resultado as { error: string }).error).toContain("conte o que está diferente");
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  });

  it("RECONHECIDA não exige texto — não há o que guardar", async () => {
    mocks.rpc.mockResolvedValue({ data: "RECONHECIDA", error: null });

    const resultado = await registrarDesfechoAction({
      ...BASE,
      acknowledgment: "RECONHECIDA",
      correction: null,
    });

    expect(resultado).toEqual({ success: true, desfecho: "RECONHECIDA" });
  });

  it("PENDENTE não é entrada — é a ausência de ato", async () => {
    const resultado = await registrarDesfechoAction({ ...BASE, acknowledgment: "PENDENTE" });

    expect(resultado.success).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("A chamada: a autoridade vive na RPC", () => {
  it("chama `acknowledge_case_need` com os quatro parâmetros do contrato", async () => {
    await registrarDesfechoAction(BASE);

    expect(mocks.rpc).toHaveBeenCalledWith("acknowledge_case_need", {
      _case_id: CASE_ID,
      _subcriterion_code: "MODELO_COMUNICACAO",
      _acknowledgment: "CORRIGIDA",
      _correction: "não foi bem isso",
    });
  });

  it("cada retorno nomeado vira uma frase que fala com ela — nenhuma é acusação", async () => {
    const esperado: Record<string, RegExp> = {
      JA_RESPONDIDO: /já respondeu sobre este ponto/,
      PERFIL_JA_RECONHECIDO: /não muda mais/,
      NAO_TRADUZIDO: /esta é a sua própria resposta/,
      CONCEITO_INEXISTENTE: /ainda não faz parte do seu Perfil/,
      TEXTO_OBRIGATORIO: /conte o que está diferente/,
    };

    for (const [retorno, frase] of Object.entries(esperado)) {
      mocks.rpc.mockResolvedValue({ data: retorno, error: null });
      const resultado = await registrarDesfechoAction(BASE);

      expect(resultado.success, retorno).toBe(false);
      expect((resultado as { error: string }).error, retorno).toMatch(frase);
      // O código cru do banco nunca chega à tela dela.
      expect((resultado as { error: string }).error, retorno).not.toContain(retorno);
    }
  });

  it("42501 é sessão expirada, nunca 'este Perfil não é seu'", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const resultado = await registrarDesfechoAction(BASE);

    expect(resultado).toMatchObject({ success: false, code: "SESSAO_EXPIRADA" });
  });
});

describe("A fronteira com a action do Curador", () => {
  const fonte = readFileSync(
    join(process.cwd(), "src/modules/paciente/desfecho-actions.ts"),
    "utf8",
  );

  it("não reutiliza a action do Curador, nem o repositório do DT-22", () => {
    // O que importa é o IMPORT, não a palavra: o comentário do arquivo explica
    // justamente por que a action do Curador não serve aqui.
    const imports = fonte
      .split("\n")
      .filter((linha) => linha.trimStart().startsWith("import"))
      .join("\n");

    expect(imports.includes("acknowledgePersonNeed")).toBe(false);
    expect(imports.includes("protocolos-actions")).toBe(false);
    expect(imports.includes("protocolos-repository")).toBe(false);
    expect(imports.includes("@/modules/curadoria/")).toBe(false);
  });

  it("não escreve em tabela nenhuma — toda escrita passa pela RPC", () => {
    for (const escrita of [".from(", "insert(", "update(", "upsert(", "delete("]) {
      expect(fonte.includes(escrita), `a action da paciente chama ${escrita}`).toBe(false);
    }
    expect(fonte).toContain('rpc("acknowledge_case_need"');
  });

  it("A4 · o escritor do Curador permanece intacto", () => {
    const acoes = readFileSync(
      join(process.cwd(), "src/modules/curadoria/protocolos-actions.ts"),
      "utf8",
    );
    expect(acoes).toContain('requireAnyRoleForAction(["curador_medico", "administrador"])');

    const repo = readFileSync(
      join(process.cwd(), "src/modules/curadoria/protocolos-repository.ts"),
      "utf8",
    );
    expect(repo).toContain("export async function acknowledgePersonNeed");
    expect(repo).toContain("correction: exigeTexto ? texto : null");
  });
});

describe("A migration: aditiva, e só", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/20260804160000_paciente_registra_o_proprio_desfecho.sql",
    ),
    "utf8",
  );

  it("não altera tabela, coluna nem policy", () => {
    for (const proibido of [
      "alter table",
      "create table",
      "add column",
      "drop column",
      "create policy",
      "drop policy",
      "alter policy",
    ]) {
      expect(sql.toLowerCase().includes(proibido), `a migration contém "${proibido}"`).toBe(false);
    }
  });

  /**
   * PP-03B · D-2 — A ACL NÃO SE PROVA POR TEXTO.
   *
   * Aqui havia asserções sobre `revoke ... from anon` e `grant ... to
   * authenticated` no SQL. Elas passaram verdes enquanto PUBLIC mantinha
   * EXECUTE — porque `create function` concede a PUBLIC por padrão e revogar
   * de `anon` não desfaz o herdado. A guarda provava que a migration DIZIA a
   * coisa certa, não que o banco ESTAVA certo.
   *
   * A prova da ACL mudou de lugar e de método: passou a perguntar ao catálogo
   * do PostgreSQL, em
   * `tests/remediacao/desfecho-da-paciente-grants.integration.test.ts`.
   * Nenhuma asserção sobre grants sobrevive neste arquivo, de propósito.
   */
  it("nenhuma guarda deste arquivo tenta provar ACL por texto", () => {
    const proprioTeste = readFileSync(
      join(process.cwd(), "tests/unit/desfecho-da-paciente.test.ts"),
      "utf8",
    );
    const asserções = proprioTeste
      .split("\n")
      .filter((linha) => linha.includes("expect(sql)"))
      .join("\n");

    expect(asserções.toLowerCase().includes("revoke")).toBe(false);
    expect(asserções.toLowerCase().includes("grant")).toBe(false);
  });

  it("a autorização é a PRIMEIRA instrução do corpo", () => {
    const corpo = sql.slice(sql.indexOf("begin"));
    const posAutorizacao = corpo.indexOf("is_patient_for_case");
    const posSelect = corpo.indexOf("select");
    expect(posAutorizacao).toBeGreaterThan(-1);
    expect(posAutorizacao).toBeLessThan(posSelect);
  });

  it("toca exatamente as duas colunas autorizadas", () => {
    const update = sql.slice(sql.indexOf("update curadoria.case_needs"), sql.indexOf("where id = linha.id"));
    expect(update).toContain("acknowledgment = _acknowledgment");
    expect(update).toContain("correction = texto");
    for (const proibida of [
      "degree",
      "options",
      "guided_text",
      "flexibility",
      "proposed_reading",
      "origin =",
      "declared_by",
      "declared_at",
    ]) {
      expect(update.includes(proibida), `o UPDATE alcança ${proibida}`).toBe(false);
    }
  });

  it("o texto dela nunca entra na trilha de auditoria", () => {
    // Só o INSERT, não o resto do arquivo: o comentário da função cita o
    // texto dela de propósito, ao explicar a regra do DT-22.
    const inicio = sql.indexOf("insert into curadoria.audit_logs");
    const auditoria = sql.slice(inicio, sql.indexOf("return _acknowledgment"));
    expect(auditoria).toContain("auth.uid()");
    expect(auditoria).toContain("'need_acknowledged'");
    expect(auditoria.includes("texto"), "o texto clínico entrou no metadata").toBe(false);
    expect(auditoria.includes("_correction"), "o texto clínico entrou no metadata").toBe(false);
  });
});

/**
 * ETAPA 2C · C9 — NENHUM RETORNO ESPECÍFICO CAI NO GENÉRICO.
 *
 * A lista de frases não é conferida contra outra lista escrita à mão — seria
 * tautologia. Ela é conferida contra os `return '...'` do PRÓPRIO SQL da RPC:
 * se uma migration futura acrescentar um retorno nomeado sem frase, este teste
 * cai antes de "Não foi possível registrar agora" chegar à tela dela.
 */
describe("C9 · toda saída nomeada da RPC tem frase própria", () => {
  const MIGRATIONS = [
    "supabase/migrations/20260804160000_paciente_registra_o_proprio_desfecho.sql",
    "supabase/migrations/20260804170000_desfecho_da_paciente_grants_hardening.sql",
  ];

  /** Os três desfechos são SUCESSO — devolvem o estado, não uma frase. */
  const DESFECHOS = new Set(["RECONHECIDA", "CORRIGIDA", "RECUSADA"]);

  function retornosDoSql(): Set<string> {
    const encontrados = new Set<string>();
    for (const arquivo of MIGRATIONS) {
      const sql = readFileSync(join(process.cwd(), arquivo), "utf8");
      for (const achado of sql.matchAll(/return '([A-Z_]+)'/g)) encontrados.add(achado[1]!);
    }
    return encontrados;
  }

  it("o SQL realmente devolve retornos nomeados — a varredura não está vazia", () => {
    expect(retornosDoSql().size).toBeGreaterThan(5);
  });

  it("cada retorno de recusa do SQL tem uma frase própria", async () => {
    const { MENSAGENS_DO_DESFECHO, MENSAGEM_GENERICA, mensagemDoRetorno } = await import(
      "@/modules/paciente/desfecho-mensagens"
    );

    for (const retorno of retornosDoSql()) {
      if (DESFECHOS.has(retorno)) continue;

      expect(
        Object.keys(MENSAGENS_DO_DESFECHO),
        `a RPC devolve "${retorno}" e nenhuma frase o cobre`,
      ).toContain(retorno);
      expect(mensagemDoRetorno(retorno), retorno).not.toBe(MENSAGEM_GENERICA);
      expect(mensagemDoRetorno(retorno).length, retorno).toBeGreaterThan(20);
    }
  });

  it("nenhuma frase expõe o código cru do banco à paciente", async () => {
    const { MENSAGENS_DO_DESFECHO } = await import("@/modules/paciente/desfecho-mensagens");

    for (const [retorno, frase] of Object.entries(MENSAGENS_DO_DESFECHO)) {
      expect(frase, retorno).not.toContain(retorno);
      expect(frase, retorno).not.toMatch(/[A-Z]{4,}_[A-Z]{4,}/);
    }
  });

  it("PERFIL_SUBSTITUIDO usa a frase do domínio, não uma inventada", async () => {
    const { MENSAGENS_DO_DESFECHO } = await import("@/modules/paciente/desfecho-mensagens");
    const { DECISION_MESSAGES } = await import("@/modules/curadoria/reconhecimento-do-perfil");

    expect(MENSAGENS_DO_DESFECHO.PERFIL_SUBSTITUIDO).toBe(DECISION_MESSAGES.PERFIL_SUBSTITUIDO);
  });
});

describe("Etapa 2C · a superfície usa o caminho autorizado", () => {
  const componente = readFileSync(
    join(process.cwd(), "src/components/paciente/desfechos-do-conceito.tsx"),
    "utf8",
  );

  it("consome `registrarDesfechoAction` e nunca a action do Curador", () => {
    expect(componente).toContain("registrarDesfechoAction");
    expect(componente.includes("acknowledgePersonNeed")).toBe(false);
    expect(componente.includes("@/modules/curadoria/")).toBe(false);
  });

  it("não consulta banco, não chama RPC direto, não escreve", () => {
    for (const proibido of ["createServerSupabaseClient", ".from(", ".rpc(", "supabase"]) {
      expect(componente.includes(proibido), `a tela faz ${proibido}`).toBe(false);
    }
  });

  it("C6/C7 · não remonta cadeia nem refaz partição", () => {
    expect(componente.includes("montarCadeiaDeProveniencia")).toBe(false);
    expect(componente.includes("PERSON_QUESTIONS_BY_CODE")).toBe(false);
    expect(componente.includes("loadCaseNeeds")).toBe(false);
  });
});
