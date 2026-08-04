import { describe, expect, it } from "vitest";

import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import { registerAcolhimentoInputSchema } from "@/modules/curadoria/schema";
import type { AcolhimentoRecord, CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";

/**
 * ITEM 1.5 — ACOLHIMENTO PREPARADO (P13).
 *
 * Os dois checkboxes eram *proxy* da informação que a própria fase já declara
 * obrigatória (`requiredInformation`). O Método M-001 troca o proxy pela coisa:
 * a fase conclui quando o Curador registrou o que extraiu do material — ou
 * quando não havia material.
 *
 * Autoridades: M-001 (predicado, ramos, monotonicidade) · M-003 (caminho de
 * escrita, emenda sobre "a história do Case", recusa de payload vazio) · DT-06.
 */

const CASE_ID = "11111111-1111-4111-8111-111111111111";

const ACOLHIMENTO_VAZIO: AcolhimentoRecord = {
  contextReviewed: false,
  documentsReviewed: false,
  meetingScheduledAt: null,
  knownFacts: [],
  openPendencies: [],
  hasSubmittedStory: false,
  hasLinkedDocument: false,
  preparedBefore: false,
};

function record(acolhimento: Partial<AcolhimentoRecord>): CuradoriaRecord {
  const base = Object.values(MOCK_RECORDS)[0]!;
  return { ...base, acolhimento: { ...ACOLHIMENTO_VAZIO, ...acolhimento } };
}

const saidaDoAcolhimento = (rec: CuradoriaRecord) =>
  COS_PHASE_DEFINITIONS.ACOLHIMENTO.exitCriteria.every((criterio) => criterio.isMet(rec));

const entradaDaHistoria = (rec: CuradoriaRecord) =>
  COS_PHASE_DEFINITIONS.HISTORIA.entryCriteria.every((criterio) => criterio.isMet(rec));

describe("T1–T6 · O predicado do Acolhimento", () => {
  it("T1 · ramo B: sem história enviada e sem documento, a fase conclui sozinha", () => {
    expect(saidaDoAcolhimento(record({}))).toBe(true);
  });

  it("T2 · ramo A: com material e sem registro, a fase não conclui", () => {
    expect(saidaDoAcolhimento(record({ hasSubmittedStory: true }))).toBe(false);
    expect(saidaDoAcolhimento(record({ hasLinkedDocument: true }))).toBe(false);
  });

  it("T3 · ramo A: fato conhecido registrado conclui a fase", () => {
    expect(
      saidaDoAcolhimento(record({ hasSubmittedStory: true, knownFacts: ["Acompanha o pai."] })),
    ).toBe(true);
  });

  it("T4 · ramo A: só pendência também conclui — a disjunção é inclusiva", () => {
    expect(
      saidaDoAcolhimento(
        record({ hasSubmittedStory: true, openPendencies: ["Exame citado não veio."] }),
      ),
    ).toBe(true);
  });

  it("T5 · listas só com espaço em branco não satisfazem o predicado", () => {
    expect(
      saidaDoAcolhimento(record({ hasSubmittedStory: true, knownFacts: ["", "   "] })),
    ).toBe(false);
  });

  it("T6 · legado: Case concluído no regime anterior permanece concluído", () => {
    expect(
      saidaDoAcolhimento(
        record({
          hasSubmittedStory: true,
          hasLinkedDocument: true,
          contextReviewed: true,
          documentsReviewed: true,
          preparedBefore: true,
        }),
      ),
    ).toBe(true);
  });

  it("um checkbox só nunca foi suficiente, e continua não sendo", () => {
    expect(
      saidaDoAcolhimento(
        record({ hasSubmittedStory: true, contextReviewed: true, preparedBefore: false }),
      ),
    ).toBe(false);
  });
});

describe("T7 · Material posterior reabre a etapa (M-001 §6.3)", () => {
  it("Case que passou pelo ramo B volta a pendente quando a história chega", () => {
    const semMaterial = record({});
    expect(saidaDoAcolhimento(semMaterial)).toBe(true);

    const materialChegou = record({ hasSubmittedStory: true });
    expect(saidaDoAcolhimento(materialChegou)).toBe(false);
  });

  it("o ramo B nunca gravou nada, logo não há `preparedBefore` para segurá-lo", () => {
    expect(record({}).acolhimento.preparedBefore).toBe(false);
  });
});

describe("T11 · A entrada de HISTORIA acompanha a saída de ACOLHIMENTO", () => {
  const cenarios: Partial<AcolhimentoRecord>[] = [
    {},
    { hasSubmittedStory: true },
    { hasSubmittedStory: true, knownFacts: ["Um fato."] },
    { hasLinkedDocument: true, openPendencies: ["Uma pendência."] },
    { hasSubmittedStory: true, preparedBefore: true },
    { hasSubmittedStory: true, knownFacts: ["   "] },
  ];

  for (const [indice, cenario] of cenarios.entries()) {
    it(`cenário ${indice + 1}: entrada e saída coincidem`, () => {
      const rec = record(cenario);
      expect(entradaDaHistoria(rec)).toBe(saidaDoAcolhimento(rec));
    });
  }
});

describe("T12 · A tabela §8.3 do M-001 permanece verdadeira", () => {
  const linhas: { n: number; caso: string; acolhimento: Partial<AcolhimentoRecord>; passa: boolean }[] =
    [
      { n: 1, caso: "há material · preparou e registrou", acolhimento: { hasSubmittedStory: true, knownFacts: ["Fato."] }, passa: true },
      { n: 2, caso: "há material · clicou sem ler", acolhimento: { hasSubmittedStory: true, contextReviewed: true, documentsReviewed: false }, passa: false },
      { n: 3, caso: "há material · leu e nada registrou", acolhimento: { hasSubmittedStory: true }, passa: false },
      { n: 4, caso: "não há material", acolhimento: {}, passa: true },
      { n: 5, caso: "Case novo, nada feito, há material", acolhimento: { hasLinkedDocument: true }, passa: false },
      { n: 6, caso: "Case antigo concluído no regime anterior", acolhimento: { hasSubmittedStory: true, preparedBefore: true }, passa: true },
      { n: 7, caso: "concluiu no ramo B, material chegou depois", acolhimento: { hasSubmittedStory: true }, passa: false },
    ];

  for (const linha of linhas) {
    it(`linha ${linha.n} · ${linha.caso} → ${linha.passa ? "passa" : "não passa"}`, () => {
      expect(saidaDoAcolhimento(record(linha.acolhimento))).toBe(linha.passa);
    });
  }
});

describe("T5/T10 · O contrato de escrita (M-003 §7.2, DT-06)", () => {
  it("recusa payload vazio, com mensagem própria", () => {
    const resultado = registerAcolhimentoInputSchema.safeParse({
      caseId: CASE_ID,
      knownFacts: [],
      openPendencies: [],
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain("ao menos um fato conhecido");
    }
  });

  it("recusa payload que só tem espaço em branco — normaliza antes de contar", () => {
    const resultado = registerAcolhimentoInputSchema.safeParse({
      caseId: CASE_ID,
      knownFacts: ["   ", ""],
      openPendencies: [],
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita um único item, em qualquer das duas listas, e o normaliza", () => {
    const comFato = registerAcolhimentoInputSchema.safeParse({
      caseId: CASE_ID,
      knownFacts: ["  Acompanha o pai.  ", ""],
      openPendencies: [],
    });
    expect(comFato.success).toBe(true);
    if (comFato.success) {
      expect(comFato.data.knownFacts).toEqual(["Acompanha o pai."]);
      expect(comFato.data.openPendencies).toEqual([]);
    }

    const soPendencia = registerAcolhimentoInputSchema.safeParse({
      caseId: CASE_ID,
      knownFacts: [],
      openPendencies: ["Exame não veio."],
    });
    expect(soPendencia.success).toBe(true);
  });

  it("os campos históricos não fazem parte do contrato de escrita", () => {
    const resultado = registerAcolhimentoInputSchema.safeParse({
      caseId: CASE_ID,
      knownFacts: ["Fato."],
      openPendencies: [],
      contextReviewed: true,
      documentsReviewed: true,
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(Object.keys(resultado.data).sort()).toEqual([
        "caseId",
        "knownFacts",
        "openPendencies",
      ]);
    }
  });
});

describe("Preservação do COS", () => {
  it("ACOLHIMENTO tem exatamente um critério de saída, e ele é o do Método", () => {
    const criterios = COS_PHASE_DEFINITIONS.ACOLHIMENTO.exitCriteria;
    expect(criterios).toHaveLength(1);
    expect(criterios[0]!.id).toBe("acolhimento-preparado");
    expect(criterios[0]!.description).toBe(
      "O Curador registrou o que extraiu do material disponível — ou não havia material.",
    );
  });

  it("o objetivo, a ordem e a informação exigida da fase permanecem intactos", () => {
    const fase = COS_PHASE_DEFINITIONS.ACOLHIMENTO;
    expect(fase.order).toBe(1);
    expect(fase.objective).toContain("o paciente nunca recomeça do zero");
    expect(fase.requiredInformation).toEqual(["Contexto já conhecido", "Documentos disponíveis"]);
    expect(fase.traceability.length).toBeGreaterThan(0);
  });

  it("nenhum critério de nenhuma fase lê os campos históricos", () => {
    // A única leitura autorizada é a do repositório, ao calcular
    // `preparedBefore` (M-003 §9.1). O predicado do COS nunca os vê.
    const soLegado = record({
      hasSubmittedStory: true,
      contextReviewed: true,
      documentsReviewed: true,
      preparedBefore: false,
    });
    expect(saidaDoAcolhimento(soLegado)).toBe(false);
  });
});
