import { beforeAll, describe, expect, it } from "vitest";

import { casoComCurador, entrarComo, serviceClient, type CadeiaCuradoria } from "./apoio";

/**
 * =============================================================================
 * PP-03A — O CAMINHO DE ESCRITA DA PACIENTE SOBRE O PRÓPRIO RECONHECIMENTO
 * =============================================================================
 *
 * O ato que o domínio reserva à paciente era praticado, no código, pelo
 * Curador. `acknowledge_case_need` devolve o ato a ela — um verbo, duas
 * colunas, uma linha — sem lhe dar `UPDATE` em `case_needs`.
 *
 * Mesmo padrão da casa: estado preparado com `service_role`, ATO com a sessão
 * REAL dela. Login de verdade, RLS de verdade. Se a autorização do corpo da
 * função falhar, estes testes falham — não há atalho de service_role no ato.
 */

const service = serviceClient();

let cadeia: CadeiaCuradoria;
let outra: CadeiaCuradoria;
let curadorId: string;

/** Uma tradução do Curador, à espera do desfecho dela. */
async function traducaoPendente(
  caseId: string,
  curadorId: string,
  code: string,
): Promise<void> {
  const { error } = await service.from("case_needs").upsert(
    {
      case_id: caseId,
      subcriterion_code: code,
      options: ["explicacao_simples"],
      degree: "ESSENCIAL",
      origin: "TRADUCAO",
      proposed_reading: "Entendi que você quer explicações em palavras simples.",
      acknowledgment: "PENDENTE",
      declared_by: curadorId,
    },
    { onConflict: "case_id,subcriterion_code" },
  );
  if (error) throw new Error(`fixture tradução: ${error.message}`);
}

async function linha(caseId: string, code: string) {
  const { data, error } = await service
    .from("case_needs")
    .select("*")
    .eq("case_id", caseId)
    .eq("subcriterion_code", code)
    .single();
  if (error) throw new Error(`leitura: ${error.message}`);
  return data as Record<string, unknown>;
}

beforeAll(async () => {
  curadorId = (await entrarComo("curador_medico")).userId;
  cadeia = await casoComCurador(service, curadorId, "pp03a");
  outra = await casoComCurador(service, curadorId, "pp03b");
});

describe("PP-03A · ela registra o próprio desfecho", () => {
  it("a paciente do Case registra CORRIGIDA, com o texto dela", async () => {
    const code = "MODELO_COMUNICACAO";
    await traducaoPendente(cadeia.caseId, curadorId, code);

    const { data, error } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "CORRIGIDA",
      _correction: "Na verdade prefiro que me expliquem com detalhes.",
    });

    expect(error).toBeNull();
    expect(data).toBe("CORRIGIDA");

    const row = await linha(cadeia.caseId, code);
    expect(row.acknowledgment).toBe("CORRIGIDA");
    expect(row.correction).toBe("Na verdade prefiro que me expliquem com detalhes.");
  });

  it("a paciente do Case registra RECUSADA, com o texto dela", async () => {
    const code = "MODELO_ALTERNATIVAS";
    await traducaoPendente(cadeia.caseId, curadorId, code);

    const { data, error } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "Não foi isso que eu disse.",
    });

    expect(error).toBeNull();
    expect(data).toBe("RECUSADA");
    expect((await linha(cadeia.caseId, code)).acknowledgment).toBe("RECUSADA");
  });

  it("RECONHECIDA não guarda texto — o reconhecimento não tem o que guardar (DT-22)", async () => {
    const code = "MODELO_PARTICIPACAO_FAMILIAR";
    await traducaoPendente(cadeia.caseId, curadorId, code);

    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECONHECIDA",
      _correction: "texto que não deve ser gravado",
    });

    expect(data).toBe("RECONHECIDA");
    expect((await linha(cadeia.caseId, code)).correction).toBeNull();
  });
});

describe("PP-03A · o que ela não pode", () => {
  it("paciente de outro Case recebe NAO_AUTORIZADO", async () => {
    const code = "MODELO_DECISAO_COMPARTILHADA";
    await traducaoPendente(cadeia.caseId, curadorId, code);

    const { data } = await outra.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "não é meu Case",
    });

    expect(data).toBe("NAO_AUTORIZADO");
    // E nada foi tocado no Case alheio.
    expect((await linha(cadeia.caseId, code)).acknowledgment).toBe("PENDENTE");
  });

  it("ela NUNCA recebe UPDATE direto em case_needs — a RLS continua fechada", async () => {
    const code = "MODELO_DECISAO_COMPARTILHADA";

    const { data } = await cadeia.paciente.client
      .from("case_needs")
      .update({ acknowledgment: "RECONHECIDA", degree: "SEM_PREFERENCIA" })
      .eq("case_id", cadeia.caseId)
      .eq("subcriterion_code", code)
      .select("id");

    // RLS sem policy de UPDATE para ela: nenhuma linha alcançada.
    expect(data ?? []).toHaveLength(0);
    expect((await linha(cadeia.caseId, code)).acknowledgment).toBe("PENDENTE");
  });

  it("estado inválido é recusado — PENDENTE não é entrada", async () => {
    const code = "MODELO_DECISAO_COMPARTILHADA";

    for (const invalido of ["PENDENTE", "APROVADA", ""]) {
      const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
        _case_id: cadeia.caseId,
        _subcriterion_code: code,
        _acknowledgment: invalido,
        _correction: "texto",
      });
      expect(data, invalido).toBe("ESTADO_INVALIDO");
    }
  });

  it("CORRIGIDA e RECUSADA sem texto recebem TEXTO_OBRIGATORIO (DT-22)", async () => {
    const code = "MODELO_DECISAO_COMPARTILHADA";

    for (const desfecho of ["CORRIGIDA", "RECUSADA"]) {
      const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
        _case_id: cadeia.caseId,
        _subcriterion_code: code,
        _acknowledgment: desfecho,
        _correction: "   ",
      });
      expect(data, desfecho).toBe("TEXTO_OBRIGATORIO");
    }
  });

  it("JA_RESPONDIDO — o desfecho não regride nem é reescrito", async () => {
    const code = "MODELO_COMUNICACAO";

    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "mudei de ideia",
    });

    expect(data).toBe("JA_RESPONDIDO");
    // O primeiro desfecho continua de pé.
    expect((await linha(cadeia.caseId, code)).acknowledgment).toBe("CORRIGIDA");
  });

  it("conceito sem tradução recebe NAO_TRADUZIDO — não há leitura de terceiro sobre a qual se manifestar", async () => {
    const code = "VIABILIDADE_CUSTO_E_PAGAMENTO";
    const { error } = await service.from("case_needs").upsert(
      {
        case_id: cadeia.caseId,
        subcriterion_code: code,
        options: ["particular"],
        degree: "ESSENCIAL",
        origin: "DIRETO",
        declared_by: cadeia.paciente.userId,
      },
      { onConflict: "case_id,subcriterion_code" },
    );
    if (error) throw new Error(`fixture direta: ${error.message}`);

    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "não concordo",
    });

    expect(data).toBe("NAO_TRADUZIDO");
  });

  it("conceito inexistente recebe CONCEITO_INEXISTENTE", async () => {
    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: "CONCEITO_QUE_NAO_EXISTE",
      _acknowledgment: "RECUSADA",
      _correction: "texto",
    });

    expect(data).toBe("CONCEITO_INEXISTENTE");
  });
});

describe("PP-03A · a fronteira dos campos", () => {
  it("apenas acknowledgment e correction mudam — nenhum outro campo é alcançável", async () => {
    const code = "MODELO_PREFERENCIAS_E_RESTRICOES";
    await traducaoPendente(cadeia.caseId, curadorId, code);

    const antes = await linha(cadeia.caseId, code);

    await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "CORRIGIDA",
      _correction: "quero acrescentar uma coisa",
    });

    const depois = await linha(cadeia.caseId, code);

    // PP-03 §5.5 — a lista fechada dos campos proibidos, um a um.
    for (const campo of [
      "id",
      "case_id",
      "subcriterion_code",
      "catalog_version",
      "options",
      "degree",
      "flexibility",
      "guided_text",
      "origin",
      "proposed_reading",
      "declared_by",
      "declared_at",
    ]) {
      expect(depois[campo], `${campo} foi alterado pelo ato dela`).toEqual(antes[campo]);
    }

    expect(depois.acknowledgment).toBe("CORRIGIDA");
    expect(depois.correction).toBe("quero acrescentar uma coisa");
  });

  it("a autoria da DECLARAÇÃO continua sendo do Curador — ela não a herda", async () => {
    const row = await linha(cadeia.caseId, "MODELO_PREFERENCIAS_E_RESTRICOES");
    expect(row.declared_by).toBe(curadorId);
    expect(row.declared_by).not.toBe(cadeia.paciente.userId);
  });
});

describe("PP-03A · a trilha do ato", () => {
  it("audit_log registra o ato com actor_id = a própria paciente, sem texto clínico", async () => {
    const { data, error } = await service
      .from("audit_logs")
      .select("actor_id, action, metadata")
      .eq("action", "need_acknowledged")
      .eq("actor_id", cadeia.paciente.userId);

    if (error) throw new Error(`audit: ${error.message}`);

    const eventos = data ?? [];
    expect(eventos.length).toBeGreaterThan(0);

    for (const evento of eventos) {
      expect(evento.actor_id).toBe(cadeia.paciente.userId);
      const metadata = evento.metadata as Record<string, unknown>;
      expect(metadata.actor_role).toBe("paciente");
      expect(metadata.case_id).toBe(cadeia.caseId);
      // O texto dela NUNCA entra em metadata (PP-03 §5.7).
      expect(JSON.stringify(metadata)).not.toContain("prefiro que me expliquem");
      expect(JSON.stringify(metadata)).not.toContain("Não foi isso que eu disse");
    }
  });

  it("recusa e idempotência NÃO geram evento — a trilha registra o ato, não a tentativa", async () => {
    const { data: antes } = await service
      .from("audit_logs")
      .select("id")
      .eq("action", "need_acknowledged")
      .eq("actor_id", outra.paciente.userId);

    await outra.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: "MODELO_COMUNICACAO",
      _acknowledgment: "RECUSADA",
      _correction: "tentativa em Case alheio",
    });

    const { data: depois } = await service
      .from("audit_logs")
      .select("id")
      .eq("action", "need_acknowledged")
      .eq("actor_id", outra.paciente.userId);

    expect(depois ?? []).toHaveLength((antes ?? []).length);
  });
});

describe("PP-03A · depois do reconhecimento do Perfil", () => {
  it("PERFIL_JA_RECONHECIDO — corrigir depois é supersessão, não segundo ato (ADR-049)", async () => {
    const code = "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS";
    await traducaoPendente(outra.caseId, curadorId, code);

    const { error } = await service
      .from("priority_profiles")
      .insert({
        case_id: outra.caseId,
        curator_id: curadorId,
        status: "VALIDATED",
        validated_at: new Date().toISOString(),
      });
    if (error) throw new Error(`fixture perfil reconhecido: ${error.message}`);

    const { data } = await outra.paciente.client.rpc("acknowledge_case_need", {
      _case_id: outra.caseId,
      _subcriterion_code: code,
      _acknowledgment: "CORRIGIDA",
      _correction: "quero corrigir depois de reconhecer",
    });

    expect(data).toBe("PERFIL_JA_RECONHECIDO");
    expect((await linha(outra.caseId, code)).acknowledgment).toBe("PENDENTE");
  });
});
