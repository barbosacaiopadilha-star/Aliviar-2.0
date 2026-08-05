import { beforeAll, describe, expect, it } from "vitest";

import { loadModeloDoReconhecimento } from "@/modules/paciente/reconhecimento-model";

import { casoComCurador, entrarComo, serviceClient, type CadeiaCuradoria, type Sessao } from "./apoio";

/**
 * =============================================================================
 * ITEM 1.10B-P2 · ETAPA 2D — O FLUXO INTEIRO, EM CONDIÇÕES REAIS
 * =============================================================================
 *
 * As etapas 2A, 2B, 2C e o PP-03 foram verificados peça a peça. Esta suíte não
 * cria nada: ela liga as peças e pergunta se o caminho inteiro anda.
 *
 *   ela lê a tradução → pratica um desfecho → RPC → persistência → auditoria
 *   → NOVA LEITURA → o que ela vê é exatamente o que ficou no banco.
 *
 * O que dá valor a estes testes é o que eles NÃO usam: nenhum ato é praticado
 * com `service_role`. O `service_role` prepara o cenário (é o Curador que não
 * está aqui) e LÊ para conferir; o ato é sempre da sessão real dela, com RLS
 * real e autenticação real. Se a autorização do corpo da RPC falhar, cai aqui.
 *
 * O elo mais importante é o da RELEITURA: a Etapa 2C mostra o desfecho por
 * estado local, sem `revalidatePath` (dívida RECONHECE-REFRESH-001). Isso só é
 * honesto se o próximo carregamento devolver a mesma coisa — e é exatamente
 * isso que `releitura()` verifica, chamando o loader de verdade.
 */

const service = serviceClient();

let cadeia: CadeiaCuradoria;
let outra: CadeiaCuradoria;
let curador: Sessao;

/** A tradução do Curador — preparada por quem de direito, nunca por ela. */
async function traducaoDoCurador(caseId: string, code: string, leitura: string): Promise<void> {
  const { error } = await service.from("case_needs").upsert(
    {
      case_id: caseId,
      subcriterion_code: code,
      options: ["explicacao_simples"],
      degree: "ESSENCIAL",
      origin: "TRADUCAO",
      proposed_reading: leitura,
      acknowledgment: "PENDENTE",
      declared_by: curador.userId,
    },
    { onConflict: "case_id,subcriterion_code" },
  );
  if (error) throw new Error(`fixture tradução: ${error.message}`);
}

/**
 * O "novo GET": o mesmo loader que a página da paciente usa, com a sessão dela.
 * Nada de ler a tabela por fora — o que se prova é o que ela veria.
 */
async function releitura(sessao: CadeiaCuradoria, code: string) {
  const modelo = await loadModeloDoReconhecimento(sessao.paciente.client, sessao.caseId);
  return modelo.linhas.find((linha) => linha.subcriterionCode === code);
}

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
  cadeia = await casoComCurador(service, curador.userId, "e2e-a");
  outra = await casoComCurador(service, curador.userId, "e2e-b");
});

describe("D1/D3 · o caminho inteiro, e a releitura que o confirma", () => {
  it("RECONHECIDA: ela lê a tradução, pratica, e o novo GET traz o que ficou", async () => {
    const code = "MODELO_COMUNICACAO";
    await traducaoDoCurador(cadeia.caseId, code, "Entendi que você quer palavras simples.");

    // 1º GET — o que ela vê antes de decidir.
    const antes = await releitura(cadeia, code);
    expect(antes!.ato.houveTraducao).toBe(true);
    expect(antes!.ato.desfecho).toBe("PENDENTE");
    expect(antes!.ato.leituraProposta).toBe("Entendi que você quer palavras simples.");

    // O ATO — sessão dela, RLS real.
    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECONHECIDA",
      _correction: null,
    });
    expect(data).toBe("RECONHECIDA");

    // 2º GET — sem estado local nenhum: o que o banco devolve.
    const depois = await releitura(cadeia, code);
    expect(depois!.ato.desfecho).toBe("RECONHECIDA");
    expect(depois!.ato.correcao).toBeNull();
    // E a leitura sobre a qual ela se manifestou continua de pé.
    expect(depois!.ato.leituraProposta).toBe(antes!.ato.leituraProposta);
  });

  it("CORRIGIDA: o texto dela sobrevive à releitura, palavra por palavra", async () => {
    const code = "MODELO_ALTERNATIVAS";
    await traducaoDoCurador(cadeia.caseId, code, "Entendi que você aceita o primeiro caminho.");

    const texto = "Preciso saber os riscos antes de aceitar qualquer coisa.";
    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "CORRIGIDA",
      _correction: texto,
    });
    expect(data).toBe("CORRIGIDA");

    const depois = await releitura(cadeia, code);
    expect(depois!.ato.desfecho).toBe("CORRIGIDA");
    expect(depois!.ato.correcao).toBe(texto);
  });

  it("RECUSADA: o mesmo caminho, com a discordância registrada", async () => {
    const code = "MODELO_PARTICIPACAO_FAMILIAR";
    await traducaoDoCurador(cadeia.caseId, code, "Entendi que sua família participa das conversas.");

    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "Não foi isso que eu disse — prefiro decidir sozinha.",
    });
    expect(data).toBe("RECUSADA");

    const depois = await releitura(cadeia, code);
    expect(depois!.ato.desfecho).toBe("RECUSADA");
    expect(depois!.ato.correcao).toContain("prefiro decidir sozinha");
  });

  it("PENDENTE: o quarto desfecho não escreve — a releitura prova que nada mudou", async () => {
    const code = "MODELO_DECISAO_COMPARTILHADA";
    await traducaoDoCurador(cadeia.caseId, code, "Entendi que você quer decidir junto.");

    const antes = await releitura(cadeia, code);
    // "Deixar pendente" é praticado NA TELA e não chama action nenhuma
    // (Etapa 2C, C4). O que se prova aqui é a consequência: nada mudou.
    const depois = await releitura(cadeia, code);

    expect(depois!.ato.desfecho).toBe("PENDENTE");
    expect(depois).toEqual(antes);
  });

  it("o desfecho não regride: repetir devolve JA_RESPONDIDO e o banco não muda", async () => {
    const code = "MODELO_COMUNICACAO";

    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "mudei de ideia",
    });

    expect(data).toBe("JA_RESPONDIDO");
    expect((await releitura(cadeia, code))!.ato.desfecho).toBe("RECONHECIDA");
  });
});

describe("D7 · quem alcança o quê", () => {
  const CODE = "MODELO_PREFERENCIAS_E_RESTRICOES";

  beforeAll(async () => {
    await traducaoDoCurador(cadeia.caseId, CODE, "Entendi que você não aceita internação.");
  });

  it("a paciente CORRETA pratica o ato", async () => {
    const { data } = await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: CODE,
      _acknowledgment: "RECONHECIDA",
      _correction: null,
    });
    expect(data).toBe("RECONHECIDA");
  });

  it("a paciente ERRADA recebe NAO_AUTORIZADO e não toca o Case alheio", async () => {
    const code = "VIABILIDADE_COBERTURA_E_CONVENIO";
    await traducaoDoCurador(cadeia.caseId, code, "Entendi que você usa convênio.");

    const { data } = await outra.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECUSADA",
      _correction: "não é meu Case",
    });

    expect(data).toBe("NAO_AUTORIZADO");
    expect((await releitura(cadeia, code))!.ato.desfecho).toBe("PENDENTE");
  });

  it("o CURADOR não tem mais como praticar o desfecho dela", async () => {
    const code = "VIABILIDADE_COBERTURA_E_CONVENIO";

    // 1. A RPC é dela: o Curador não passa por `is_patient_for_case`.
    const { data } = await curador.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "RECONHECIDA",
      _correction: null,
    });
    expect(data).toBe("NAO_AUTORIZADO");

    // 2. E o UPDATE direto — que a RLS ainda concede a ele — não é mais
    //    alcançável por nenhuma superfície (PP-03C). Aqui provamos o que a
    //    RLS faz; a ausência de caminho no código é provada pela varredura em
    //    tests/unit/desfechos-do-reconhecimento.test.ts.
    expect((await releitura(cadeia, code))!.ato.desfecho).toBe("PENDENTE");
  });

  it("a paciente continua sem UPDATE direto — só o verbo da RPC", async () => {
    const code = "VIABILIDADE_COBERTURA_E_CONVENIO";

    const { data } = await cadeia.paciente.client
      .from("case_needs")
      .update({ acknowledgment: "RECONHECIDA", degree: "SEM_PREFERENCIA" })
      .eq("case_id", cadeia.caseId)
      .eq("subcriterion_code", code)
      .select("id");

    expect(data ?? []).toHaveLength(0);
    expect((await releitura(cadeia, code))!.ato.desfecho).toBe("PENDENTE");
  });
});

describe("D5 · o Curador, do outro lado do mesmo fato", () => {
  it("ele registra a tradução, e ela nasce aguardando o ato dela", async () => {
    const code = "CONTINUIDADE_COORDENACAO";
    const { registerPersonNeed } = await import("@/modules/curadoria/protocolos-repository");

    const registro = await registerPersonNeed(curador.client, {
      caseId: cadeia.caseId,
      subcriterionCode: code,
      options: ["SIM"],
      degree: "PESA_MUITO",
      flexibility: null,
      guidedText: null,
      origin: "TRADUCAO",
      proposedReading: "Entendi que seus médicos precisam conversar entre si.",
      declaredBy: curador.userId,
    });

    expect(registro.acknowledgment).toBe("PENDENTE");
    expect(registro.proposedReading).toContain("precisam conversar");
  });

  it("PP-03C · re-registrar a tradução NÃO apaga o desfecho já praticado por ela", async () => {
    const code = "CONTINUIDADE_COORDENACAO";
    const { registerPersonNeed, loadCaseNeeds } = await import(
      "@/modules/curadoria/protocolos-repository"
    );

    await cadeia.paciente.client.rpc("acknowledge_case_need", {
      _case_id: cadeia.caseId,
      _subcriterion_code: code,
      _acknowledgment: "CORRIGIDA",
      _correction: "Só o cardiologista precisa saber.",
    });

    // O Curador reabre "Atualizar registro" e salva de novo — o gesto que,
    // antes do PP-03C, zerava o desfecho dela em silêncio.
    await registerPersonNeed(curador.client, {
      caseId: cadeia.caseId,
      subcriterionCode: code,
      options: ["SIM"],
      degree: "ESSENCIAL",
      flexibility: null,
      guidedText: null,
      origin: "TRADUCAO",
      proposedReading: "Entendi melhor: seus médicos precisam se coordenar.",
      declaredBy: curador.userId,
    });

    const depois = (await loadCaseNeeds(curador.client, cadeia.caseId)).find(
      (need) => need.subcriterionCode === code,
    )!;

    expect(depois.acknowledgment).toBe("CORRIGIDA");
    expect(depois.correction).toBe("Só o cardiologista precisa saber.");
    // E a tradução dele, essa sim, foi atualizada.
    expect(depois.proposedReading).toContain("se coordenar");
    expect(depois.degree).toBe("ESSENCIAL");
  });

  it("ele LÊ o que ela respondeu — a resposta dela chega ao painel dele", async () => {
    const { loadCaseNeeds } = await import("@/modules/curadoria/protocolos-repository");

    const doCurador = await loadCaseNeeds(curador.client, cadeia.caseId);
    const comunicacao = doCurador.find((n) => n.subcriterionCode === "MODELO_COMUNICACAO")!;
    const alternativas = doCurador.find((n) => n.subcriterionCode === "MODELO_ALTERNATIVAS")!;

    expect(comunicacao.acknowledgment).toBe("RECONHECIDA");
    expect(alternativas.acknowledgment).toBe("CORRIGIDA");
    expect(alternativas.correction).toContain("riscos antes de aceitar");
  });
});

describe("D6 · a trilha do ato", () => {
  it("cada ato efetivo tem um evento, com ela como autora", async () => {
    const { data, error } = await service
      .from("audit_logs")
      .select("actor_id, action, metadata")
      .eq("action", "need_acknowledged")
      .eq("actor_id", cadeia.paciente.userId);

    if (error) throw new Error(`audit: ${error.message}`);
    const eventos = data ?? [];

    // Cinco atos efetivos neste Case: RECONHECIDA, CORRIGIDA, RECUSADA,
    // PREFERENCIAS (RECONHECIDA) e COORDENACAO (CORRIGIDA).
    expect(eventos.length).toBe(5);

    for (const evento of eventos) {
      expect(evento.actor_id).toBe(cadeia.paciente.userId);
      expect(evento.action).toBe("need_acknowledged");

      const metadata = evento.metadata as Record<string, unknown>;
      expect(metadata.actor_role).toBe("paciente");
      expect(metadata.case_id).toBe(cadeia.caseId);
      expect(metadata.subcriterion_code).toBeTruthy();
      expect(metadata.acknowledged_at).toBeTruthy();
    }
  });

  it("nenhum texto clínico dela entra na trilha", async () => {
    const { data } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "need_acknowledged")
      .eq("actor_id", cadeia.paciente.userId);

    const tudo = JSON.stringify(data ?? []);
    for (const trecho of [
      "riscos antes de aceitar",
      "prefiro decidir sozinha",
      "Só o cardiologista",
    ]) {
      expect(tudo, `o texto dela vazou para a auditoria: ${trecho}`).not.toContain(trecho);
    }
  });

  it("as recusas não geram evento — a trilha registra o ato, nunca a tentativa", async () => {
    const { data } = await service
      .from("audit_logs")
      .select("id")
      .eq("action", "need_acknowledged")
      .eq("actor_id", outra.paciente.userId);

    // A paciente errada tentou uma vez e foi barrada: zero eventos.
    expect(data ?? []).toHaveLength(0);
  });

  it("a autoria da DECLARAÇÃO segue do Curador — as duas autorias não se misturam", async () => {
    const { data } = await service
      .from("case_needs")
      .select("declared_by, acknowledgment")
      .eq("case_id", cadeia.caseId)
      .eq("subcriterion_code", "MODELO_COMUNICACAO")
      .single();

    expect(data!.declared_by).toBe(curador.userId);
    expect(data!.declared_by).not.toBe(cadeia.paciente.userId);
    expect(data!.acknowledgment).toBe("RECONHECIDA");
  });
});
