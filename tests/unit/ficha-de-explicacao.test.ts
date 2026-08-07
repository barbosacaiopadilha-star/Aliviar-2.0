import { describe, expect, it } from "vitest";

import {
  construirFicha,
  explicarLeitura,
  GRAUS_DE_CONFIANCA,
  NAO_HA_POSICAO,
  type EntradaDaFicha,
} from "@/modules/curadoria/ficha-de-explicacao";
import {
  CONTRADICOES_DE_PROVENIENCIA,
  montarCadeiaDeProveniencia,
  type CadeiaDeProveniencia,
  type EvidenciaDaCadeia,
  type PropostaDaCadeia,
} from "@/modules/curadoria/cadeia-de-proveniencia";
import {
  paraMesa,
  paraPaciente,
  paraRelatorio,
} from "@/modules/curadoria/ficha-de-explicacao-vocabulario";
import { PATIENT_FORBIDDEN_TERMS, violatesPatientVocabulary } from "@/modules/paciente/experiencia";
import { conceitosForaDoMotor } from "@/modules/curadoria/participacao-no-motor";
import { CATALOGO_GERADO } from "@/modules/curadoria/catalogo-gerado";

/**
 * ITEM 1.8 — FICHA DE EXPLICAÇÃO (Arquitetura §11), REESCRITA NA R1 · A2.
 *
 * MUDANÇA DE CONTRATO LAVRADA (CONTRATO_1_8_R1 §9, autorizada pelo DT-01): a
 * Ficha deixou de receber `OrigemDoConceito` — o modelo paralelo do `c3242ea`
 * — e passou a consumir `CadeiaDeProveniencia`. As fixtures daqui constroem a
 * cadeia PELO MONTADOR CANÔNICO, nunca por literal paralelo: se o montador
 * mudar, estes testes sentem, que é exatamente o acoplamento certo.
 *
 * O que se prova: as seis respostas existem separadas; a confiança é
 * qualitativa e obedece às cinco proibições; os três vocabulários dizem a mesma
 * verdade em três línguas; e AC-EXPLICA bloqueia em vez de inventar.
 */

const AUTOR = "00000000-0000-4000-8000-0000000000a1";
const DECLARADO_EM = "2026-08-01T10:00:00+00:00";
const CONFIRMADO_EM = "2026-08-02T09:00:00+00:00";

const PROPOSTA_SINTETICA: PropostaDaCadeia = {
  propostaId: "00000000-0000-4000-8000-0000000000p1",
  ruleId: "regra-sintetica",
  ruleVersion: 1,
  caseId: "00000000-0000-4000-8000-0000000000c1",
  subcriterionCode: "MODELO_COMUNICACAO",
  suggestedValue: "MUITO_IMPORTANTE",
  originRecord: "case_needs:sintetico",
  originVersion: "ESSENCIAL",
  originAuthor: AUTOR,
  emittedAt: "2026-08-02T08:00:00+00:00",
};

const EVIDENCIA_SINTETICA: EvidenciaDaCadeia = {
  evidenceId: "00000000-0000-4000-8000-0000000000e1",
  professionalProfileId: "00000000-0000-4000-8000-0000000000f1",
  subcriterionCode: "MODELO_COMUNICACAO",
  version: 1,
  source: "cadastro inicial",
  sourceTier: "OFICIAL_PRIMARIA",
  collectedBy: AUTOR,
  collectedAt: "2026-07-01T08:00:00+00:00",
  verifiedBy: null,
  verifiedAt: null,
  verificationSource: null,
};

/** A cadeia de um conceito, montada pelo MONTADOR CANÔNICO — nunca por literal. */
function cadeiaDe(
  code: string,
  over: {
    degree?: "ESSENCIAL" | "PESA_MUITO" | "DESEJAVEL" | "SEM_PREFERENCIA";
    semDeclaracao?: boolean;
    proposta?: PropostaDaCadeia | null;
    evidencia?: EvidenciaDaCadeia | null;
  } = {},
): CadeiaDeProveniencia {
  return montarCadeiaDeProveniencia({
    subcriterionCode: code,
    pessoa: {
      declaracao: over.semDeclaracao
        ? null
        : { degree: over.degree ?? "ESSENCIAL", options: ["A"], declaredBy: AUTOR, declaredAt: DECLARADO_EM },
      importancia: {
        importance: "MUITO_IMPORTANTE",
        declaredBy: AUTOR,
        registradoEm: CONFIRMADO_EM,
      },
      proposta: over.proposta ?? null,
    },
    profissional: {
      estado: { status: "CONFIRMADO", declaredBy: AUTOR, registradoEm: CONFIRMADO_EM },
      evidencia:
        over.evidencia !== undefined
          ? over.evidencia
          : { ...EVIDENCIA_SINTETICA, subcriterionCode: code },
    },
    alvo: { caseId: null, professionalProfileId: "00000000-0000-4000-8000-0000000000f1" },
  });
}

function entrada(over: Partial<EntradaDaFicha> = {}): EntradaDaFicha {
  return {
    professionalProfileId: "00000000-0000-4000-8000-0000000000f1",
    leitura: {
      rows: [
        {
          subcriterionCode: "MODELO_COMUNICACAO",
          importance: "MUITO_IMPORTANTE",
          status: "CONFIRMADO",
          result: "ALTA_COMPATIBILIDADE",
        },
      ],
      summary: {
        totalSubcriteria: 1,
        highCompatibility: 1,
        mediumCompatibility: 0,
        informationGaps: 0,
        notRelevant: 0,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
    },
    cadeias: [cadeiaDe("MODELO_COMUNICACAO")],
    foraDoMotorPorMetodo: conceitosForaDoMotor(),
    ...over,
  };
}

function fichaOk(over: Partial<EntradaDaFicha> = {}) {
  const r = construirFicha(entrada(over));
  if (!r.integral) throw new Error(`esperava Ficha integral, veio: ${JSON.stringify(r.bloqueios)}`);
  return r.ficha;
}

// ===========================================================================
// §11.2 — as seis respostas
// ===========================================================================

describe("§11.2 · as seis respostas existem, e existem separadas", () => {
  it("a Ficha responde as seis, cada uma no seu campo", () => {
    const { respostas } = fichaOk();
    expect(Object.keys(respostas).sort()).toEqual([
      "criteriosQueInfluenciaram",
      "criteriosQueNaoInfluenciaram",
      "grauDeConfianca",
      "lacunas",
      "porQueFoiEscolhida",
      "porQueNestaPosicao",
    ]);
  });

  it("1 — por que foi escolhida: o grau vem da DECLARAÇÃO na cadeia, não de eco", () => {
    const [c] = fichaOk().respostas.porQueFoiEscolhida;
    expect(c).toEqual({
      subcriterionCode: "MODELO_COMUNICACAO",
      degreeDela: "ESSENCIAL",
      estadoDele: "CONFIRMADO",
      resultado: "ALTA_COMPATIBILIDADE",
    });
  });

  it("2 — a resposta sobre posição é NÃO HÁ POSIÇÃO, dita explicitamente", () => {
    expect(fichaOk().respostas.porQueNestaPosicao).toBe(NAO_HA_POSICAO);
    expect(paraMesa(fichaOk()).porQueNestaPosicao).toMatch(/não há posição/i);
    expect(paraPaciente(fichaOk()).sobreAOrdem).toMatch(/não quer dizer nada/i);
  });

  it("4 — os três motivos de não-influência nunca são fundidos", () => {
    const foraDoMotor = conceitosForaDoMotor()[0]!;
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
          {
            subcriterionCode: foraDoMotor,
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "NAO_RELEVANTE",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "NAO_INFLUENCIA",
            status: "CONFIRMADO",
            result: "NAO_RELEVANTE",
          },
        ],
        summary: {
          totalSubcriteria: 3,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 0,
          notRelevant: 2,
          gapsWithoutAnyRecord: 0,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [
        cadeiaDe("MODELO_COMUNICACAO"),
        cadeiaDe(foraDoMotor),
        cadeiaDe("MODELO_ALTERNATIVAS", { degree: "SEM_PREFERENCIA" }),
      ],
    });

    const motivos = ficha.respostas.criteriosQueNaoInfluenciaram;
    expect(motivos.find((m) => m.subcriterionCode === foraDoMotor)?.motivo).toBe(
      "FORA_DO_MOTOR_POR_METODO",
    );
    expect(motivos.find((m) => m.subcriterionCode === "MODELO_ALTERNATIVAS")?.motivo).toBe(
      "GRAU_SEM_PREFERENCIA",
    );
    // (b) é fato sobre o CASE: todo conceito ativo que não entrou na leitura.
    const naoDeclarados = motivos.filter(
      (m) => m.motivo === "SEM_IMPORTANCIA_DECLARADA_PELO_CASE",
    );
    expect(naoDeclarados.length).toBeGreaterThan(0);
    expect(naoDeclarados.map((m) => m.subcriterionCode)).not.toContain("MODELO_COMUNICACAO");
  });

  it("5 — as lacunas vêm separadas por natureza, nunca somadas", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "MUITO_IMPORTANTE",
            status: "NAO_INFORMADO",
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 3,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 2,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [
        cadeiaDe("MODELO_COMUNICACAO"),
        cadeiaDe("MODELO_ALTERNATIVAS"),
        cadeiaDe("ACESSO_MODALIDADE"),
      ],
      pendencias: [{ subcriterionCode: "ACESSO_MODALIDADE", natureza: "JUIZO_HUMANO_PENDENTE" }],
    });

    expect(ficha.respostas.lacunas).toEqual([
      { subcriterionCode: "MODELO_COMUNICACAO", natureza: "NINGUEM_OLHOU" },
      { subcriterionCode: "MODELO_ALTERNATIVAS", natureza: "OLHARAM_E_NAO_SOUBERAM" },
      { subcriterionCode: "ACESSO_MODALIDADE", natureza: "JUIZO_HUMANO_PENDENTE" },
    ]);
  });
});

// ===========================================================================
// §11.3 — confiança qualitativa e as cinco proibições
// ===========================================================================

describe("§11.3 · o grau de confiança é qualitativo", () => {
  it("é um dos três estados nomeados, e só", () => {
    expect(GRAUS_DE_CONFIANCA).toEqual([
      "LEITURA_COMPLETA",
      "LEITURA_COM_LACUNAS",
      "LEITURA_INSUFICIENTE",
    ]);
    expect(GRAUS_DE_CONFIANCA).toContain(fichaOk().respostas.grauDeConfianca);
  });

  it("leitura sem lacuna é COMPLETA; com lacuna é COM_LACUNAS", () => {
    expect(fichaOk().respostas.grauDeConfianca).toBe("LEITURA_COMPLETA");

    const comLacuna = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [cadeiaDe("MODELO_COMUNICACAO"), cadeiaDe("ACESSO_MODALIDADE")],
    });
    expect(comLacuna.respostas.grauDeConfianca).toBe("LEITURA_COM_LACUNAS");
  });

  it("sem estado para nenhum conceito essencial é INSUFICIENTE", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 1,
          highCompatibility: 0,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [cadeiaDe("MODELO_COMUNICACAO")],
    });
    expect(ficha.respostas.grauDeConfianca).toBe("LEITURA_INSUFICIENTE");
  });

  // --- as cinco proibições, uma a uma ---------------------------------------

  it("proibição 1 — nunca um número: nada na Ficha é numérico", () => {
    const ficha = fichaOk();
    const numericos = Object.entries(ficha.respostas).filter(
      ([, v]) => typeof v === "number",
    );
    expect(numericos, "a confiança virou número").toEqual([]);
    expect(typeof ficha.respostas.grauDeConfianca).toBe("string");

    const textos = [
      ...paraMesa(ficha).grauDeConfianca,
      paraRelatorio(ficha).grauDeConfianca,
      paraPaciente(ficha).sobreAsInformacoes,
    ].join(" ");
    expect(textos, "nasceu percentual ou fração na confiança").not.toMatch(/\d+\s*%|\d+\s*\/\s*\d+/);
  });

  it("proibição 2 — nunca comparativo: a Ficha só fala de um profissional", () => {
    const a = fichaOk();
    const b = fichaOk({ professionalProfileId: "00000000-0000-4000-8000-0000000000f2" });
    const textoDeA = JSON.stringify([paraMesa(a), paraRelatorio(a), paraPaciente(a)]);
    expect(textoDeA, "a Ficha de um mencionou o outro").not.toContain(b.professionalProfileId);
  });

  it("proibição 3 — nunca chave de ordenação: a lista sai na ordem de entrada", () => {
    const um = entrada({ professionalProfileId: "prof-1" });
    const dois = entrada({
      professionalProfileId: "prof-2",
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 1,
          highCompatibility: 0,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
    });

    // `prof-2` tem leitura pior. Se a confiança ordenasse, ele mudaria de lugar.
    expect(explicarLeitura([um, dois]).fichas.map((f) => f.professionalProfileId)).toEqual([
      "prof-1",
      "prof-2",
    ]);
    expect(explicarLeitura([dois, um]).fichas.map((f) => f.professionalProfileId)).toEqual([
      "prof-2",
      "prof-1",
    ]);
  });

  it("proibição 4 — nunca mérito: a lacuna é dita como dívida da operação", () => {
    const comLacuna = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [cadeiaDe("MODELO_COMUNICACAO"), cadeiaDe("ACESSO_MODALIDADE")],
    });
    const frase = paraRelatorio(comLacuna).grauDeConfianca;
    expect(frase).toMatch(/não defeito de quem é lido/i);
    expect(frase, "a lacuna virou culpa do profissional").not.toMatch(
      /profissional (não|nao) (informou|quis|soube)/i,
    );
  });

  it("proibição 5 — nunca vocabulário de qualidade sobre a pessoa", () => {
    const ficha = fichaOk();
    const tudo = JSON.stringify([paraMesa(ficha), paraRelatorio(ficha), paraPaciente(ficha)]);
    for (const juizo of ["excelente", "melhor", "pior", "ótimo", "ruim", "qualidade do profissional"]) {
      expect(tudo.toLowerCase(), `julgamento da pessoa: "${juizo}"`).not.toContain(juizo);
    }
  });
});

// ===========================================================================
// §11.5 — os três vocabulários
// ===========================================================================

describe("§11.5 · três vocabulários, uma verdade", () => {
  it("Mesa: técnico completo, com célula nomeada e a árvore vinda DA CADEIA", () => {
    const mesa = paraMesa(
      fichaOk({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            proposta: PROPOSTA_SINTETICA,
            evidencia: EVIDENCIA_SINTETICA,
          }),
        ],
      }),
    );
    expect(mesa.porQueFoiEscolhida[0]).toBe(
      "MODELO_COMUNICACAO · ESSENCIAL × CONFIRMADO → ALTA_COMPATIBILIDADE",
    );
    // MUDANÇA DE CONTRATO (A2): a linha deixou de citar `[VIGENTE]` — o estado
    // da regra era fato afirmado pelo chamador, e a A3 o confrontará contra o
    // banco. A árvore agora nasce das cadeias, com a evidência junto.
    expect(mesa.proveniencia[0]).toContain("regra regra-sintetica v1");
    expect(mesa.proveniencia[0]).toContain("case_needs(ESSENCIAL");
    expect(mesa.proveniencia[0]).toContain("evidência v1 (OFICIAL_PRIMARIA · cadastro inicial)");
  });

  it("Relatório: verbaliza e carrega a proveniência, sem copiar o técnico cru", () => {
    const rel = paraRelatorio(
      fichaOk({
        cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA })],
      }),
    );
    expect(rel.porQueFoiEscolhida[0]).toContain("Como explica");
    expect(rel.porQueFoiEscolhida[0]).toContain("regra regra-sintetica, versão 1");
    expect(rel.porQueFoiEscolhida[0], "copiou a representação técnica crua").not.toContain(
      "MODELO_COMUNICACAO",
    );
    expect(rel.porQueFoiEscolhida[0]).not.toContain("×");
  });

  it("paciente: nenhum termo proibido, nenhum identificador técnico", () => {
    const ficha = fichaOk({
      leitura: {
        rows: [
          {
            subcriterionCode: "MODELO_COMUNICACAO",
            importance: "MUITO_IMPORTANTE",
            status: "CONFIRMADO",
            result: "ALTA_COMPATIBILIDADE",
          },
          {
            subcriterionCode: "MODELO_ALTERNATIVAS",
            importance: "MUITO_IMPORTANTE",
            status: null,
            result: "LACUNA_DE_INFORMACAO",
          },
        ],
        summary: {
          totalSubcriteria: 2,
          highCompatibility: 1,
          mediumCompatibility: 0,
          informationGaps: 1,
          notRelevant: 0,
          gapsWithoutAnyRecord: 1,
          notDeclaredByCase: 0,
        },
      },
      cadeias: [
        cadeiaDe("MODELO_COMUNICACAO", {
          proposta: PROPOSTA_SINTETICA,
          evidencia: EVIDENCIA_SINTETICA,
        }),
        cadeiaDe("MODELO_ALTERNATIVAS", {
          proposta: { ...PROPOSTA_SINTETICA, subcriterionCode: "MODELO_ALTERNATIVAS" },
        }),
      ],
    });

    const texto = Object.values(paraPaciente(ficha)).flat().join(" ");

    const proibido = violatesPatientVocabulary(texto);
    expect(proibido, `vazou termo proibido: ${proibido}`).toBeNull();

    // Identificadores técnicos: código, regra, versão, ids, enums, evidência.
    for (const vazamento of [
      "MODELO_COMUNICACAO",
      "regra-sintetica",
      "v1",
      "versão 1",
      "ALTA_COMPATIBILIDADE",
      "LACUNA_DE_INFORMACAO",
      "CONFIRMADO",
      "ESSENCIAL",
      "LEITURA_COM_LACUNAS",
      "OFICIAL_PRIMARIA",
      PROPOSTA_SINTETICA.propostaId,
      EVIDENCIA_SINTETICA.evidenceId,
      ficha.professionalProfileId,
    ]) {
      expect(texto, `vazou identificador técnico: ${vazamento}`).not.toContain(vazamento);
    }
  });

  it("os termos proibidos cobrem a Ficha da paciente em qualquer combinação", () => {
    // Falseabilidade: a varredura enxerga de verdade o que ela promete varrer.
    expect(PATIENT_FORBIDDEN_TERMS.length).toBeGreaterThan(5);
    for (const termo of PATIENT_FORBIDDEN_TERMS) {
      // A varredura acusa — qual termo ela nomeia pode ser um prefixo legítimo
      // (`internalScore` acusa por `score`), e exigir o nome exato mediria a
      // ordem da lista em vez da proteção.
      expect(
        violatesPatientVocabulary(`frase da paciente com ${termo} no meio`),
        `a varredura não pegou "${termo}"`,
      ).not.toBeNull();
    }
  });

  it("os três vocabulários falam do MESMO conjunto de conceitos", () => {
    const ficha = fichaOk();
    expect(paraMesa(ficha).criteriosQueInfluenciaram).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
    expect(paraRelatorio(ficha).criteriosQueInfluenciaram).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
    expect(paraPaciente(ficha).oQueFoiConsiderado).toHaveLength(
      ficha.respostas.criteriosQueInfluenciaram.length,
    );
  });
});

// ===========================================================================
// AC-EXPLICA — bloqueio nomeado
// ===========================================================================

// ===========================================================================
// AC-EXPLICA — a unidade de bloqueio é a AFIRMAÇÃO (§12/§13)
// ===========================================================================

describe("AC-EXPLICA · por afirmação, com motivo nomeado", () => {
  function resultado(over: Partial<EntradaDaFicha>) {
    return construirFicha(entrada(over));
  }
  const afirmacoesDe = (r: ReturnType<typeof construirFicha>) => [
    ...new Set(r.bloqueios.map((b) => b.afirmacao)),
  ];
  const motivosDe = (r: ReturnType<typeof construirFicha>) => [
    ...new Set(r.bloqueios.map((b) => b.motivo)),
  ];

  it("Ficha íntegra → todas as afirmações exibíveis", () => {
    const r = resultado({});
    expect(r.integral).toBe(true);
    for (const a of ["R1", "R2", "R3", "R4", "R5", "R6"] as const) {
      expect(r.ficha.status[a].exibivel, a).toBe(true);
    }
  });

  it("conceito lido sem cadeia → SEM_ORIGEM em toda afirmação dependente; R2 nunca", () => {
    const r = resultado({ cadeias: [] });
    expect(r.integral).toBe(false);
    expect(motivosDe(r)).toEqual(["SEM_ORIGEM"]);
    expect(afirmacoesDe(r).sort()).toEqual(["R1", "R3", "R4", "R5", "R6"]);
    expect(r.ficha.status.R2.exibivel, "R2 não depende de ramo (§12)").toBe(true);
    expect(r.ficha.respostas.porQueNestaPosicao).toBe(NAO_HA_POSICAO);
  });

  it("declaração ausente → cai o ramo importância (R1, R3, R4, R6); R5 sobrevive", () => {
    const r = resultado({
      cadeias: [cadeiaDe("MODELO_COMUNICACAO", { semDeclaracao: true })],
    });
    expect(motivosDe(r)).toEqual(["SEM_DECLARACAO_ORIGINAL"]);
    expect(afirmacoesDe(r).sort()).toEqual(["R1", "R3", "R4", "R6"]);
    expect(r.ficha.status.R5.exibivel).toBe(true);
  });

  it("proposta malformada (regra/versão) → ramo importância bloqueado", () => {
    for (const [proposta, motivo] of [
      [{ ...PROPOSTA_SINTETICA, ruleId: "  " }, "SEM_REGRA"],
      [{ ...PROPOSTA_SINTETICA, ruleVersion: null as unknown as number }, "SEM_VERSAO"],
      [{ ...PROPOSTA_SINTETICA, ruleVersion: 0 }, "VERSAO_INVALIDA"],
      [{ ...PROPOSTA_SINTETICA, ruleVersion: 1.5 }, "VERSAO_INVALIDA"],
    ] as const) {
      const r = resultado({ cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta })] });
      expect(motivosDe(r), JSON.stringify(proposta)).toContain(motivo);
      expect(afirmacoesDe(r).sort()).toEqual(["R1", "R3", "R6"]);
    }
  });

  it("estado afirmado sem evidência (legado, §6) → R1/R3/R6 caem; R5 relata a falta", () => {
    const r = resultado({
      cadeias: [cadeiaDe("MODELO_COMUNICACAO", { evidencia: null })],
    });
    expect(r.integral).toBe(false);
    expect(motivosDe(r)).toEqual(["SEM_EVIDENCIA_VINCULADA"]);
    expect(afirmacoesDe(r).sort()).toEqual(["R1", "R3", "R6"]);
    // R5 fica de pé DE PROPÓSITO: a frase de R5 é sobre a lacuna, e bloquear o
    // relato da falta porque falta seria o silêncio que o AC-EXPLICA proíbe.
    expect(r.ficha.status.R5.exibivel).toBe(true);
    // E o conceito não vira correspondência: a afirmação dependente sumiu do
    // CONTEÚDO, não só do status.
    expect(r.ficha.respostas.porQueFoiEscolhida).toEqual([]);
  });

  it("a superfície recebe as DUAS listas: todas as Fichas, e o que não é exibível", () => {
    const leitura = explicarLeitura([
      entrada({ professionalProfileId: "prof-ok" }),
      entrada({ professionalProfileId: "prof-sem-origem", cadeias: [] }),
    ]);
    // Bloqueio de afirmação NÃO é desaparecimento da Ficha (§13).
    expect(leitura.fichas.map((f) => f.professionalProfileId)).toEqual([
      "prof-ok",
      "prof-sem-origem",
    ]);
    expect(leitura.naoExibiveis).toHaveLength(1);
    expect(leitura.naoExibiveis[0]!.professionalProfileId).toBe("prof-sem-origem");
    expect(leitura.naoExibiveis[0]!.bloqueios[0]!.motivo).toBe("SEM_ORIGEM");
  });

  it("não existe texto de reserva no resultado", () => {
    const r = construirFicha(entrada({ cadeias: [] }));
    const texto = JSON.stringify(r).toLowerCase();
    for (const reserva of [
      "não foi possível",
      "indisponível no momento",
      "sem informações",
      "tente novamente",
      "erro ao",
    ]) {
      expect(texto, `nasceu texto genérico de reserva: "${reserva}"`).not.toContain(reserva);
    }
  });
});

// ===========================================================================
// §10 — COERÊNCIA: fatos confrontados, contradições nomeadas
// ===========================================================================

describe("§10 · PROVENIENCIA_INCONSISTENTE, com discriminador obrigatório", () => {
  const soContradicoes = (r: ReturnType<typeof construirFicha>) =>
    r.bloqueios.flatMap((b) => (b.motivo === "PROVENIENCIA_INCONSISTENTE" ? [b.contradicao] : []));

  it("1 · caminho que AFIRMA regra sem proposta → PROPOSTA_INEXISTENTE", () => {
    const r = construirFicha(
      entrada({
        cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: null })],
        afirmacoes: [{ subcriterionCode: "MODELO_COMUNICACAO", ruleId: "regra-sintetica" }],
      }),
    );
    expect([...new Set(soContradicoes(r))]).toEqual(["PROPOSTA_INEXISTENTE"]);
    expect(r.ficha.status.R1.exibivel).toBe(false);
  });

  it("10 · caminho manual SEM afirmação continua NAO_APLICAVEL — nunca inconsistência", () => {
    const r = construirFicha(
      entrada({ cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: null })] }),
    );
    expect(r.integral, JSON.stringify(r.bloqueios)).toBe(true);
  });

  it("2/3 · regra ou versão afirmada ≠ persistida → contradição exata, e a autoridade é o banco", () => {
    const base = { cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA })] };

    const outraRegra = construirFicha(
      entrada({
        ...base,
        afirmacoes: [{ subcriterionCode: "MODELO_COMUNICACAO", ruleId: "outra" }],
      }),
    );
    expect([...new Set(soContradicoes(outraRegra))]).toEqual(["PROPOSTA_DE_OUTRA_REGRA"]);

    const outraVersao = construirFicha(
      entrada({
        ...base,
        afirmacoes: [
          { subcriterionCode: "MODELO_COMUNICACAO", ruleId: "regra-sintetica", ruleVersion: 2 },
        ],
      }),
    );
    expect([...new Set(soContradicoes(outraVersao))]).toEqual(["PROPOSTA_DE_OUTRA_VERSAO"]);
    expect(outraVersao.ficha.status.R1.exibivel, "a afirmação dependente renderizou").toBe(false);

    // Afirmação CORRETA não produz nada: o eco morreu, o confronto vive.
    const correta = construirFicha(
      entrada({
        ...base,
        afirmacoes: [
          { subcriterionCode: "MODELO_COMUNICACAO", ruleId: "regra-sintetica", ruleVersion: 1 },
        ],
      }),
    );
    expect(correta.integral).toBe(true);
  });

  it("4 · proposta de OUTRO Case → ALVO_DIVERGENTE", () => {
    const cadeia = montarCadeiaDeProveniencia({
      subcriterionCode: "MODELO_COMUNICACAO",
      alvo: { caseId: "case-deste-alvo", professionalProfileId: null },
      pessoa: {
        declaracao: {
          degree: "ESSENCIAL",
          options: ["A"],
          declaredBy: AUTOR,
          declaredAt: DECLARADO_EM,
        },
        importancia: {
          importance: "MUITO_IMPORTANTE",
          declaredBy: AUTOR,
          registradoEm: CONFIRMADO_EM,
        },
        proposta: { ...PROPOSTA_SINTETICA, caseId: "case-de-outro-alvo" },
      },
      profissional: { estado: null, evidencia: null },
    });
    const r = construirFicha(entrada({ cadeias: [cadeia] }));
    expect(soContradicoes(r)).toContain("ALVO_DIVERGENTE");
  });

  it("5 · proposta de outro conceito → CONCEITO_DIVERGENTE", () => {
    const r = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            proposta: { ...PROPOSTA_SINTETICA, subcriterionCode: "MODELO_ALTERNATIVAS" },
          }),
        ],
      }),
    );
    expect(soContradicoes(r)).toContain("CONCEITO_DIVERGENTE");
  });

  it("6 · origem de outra pessoa → ORIGEM_DE_OUTRA_PESSOA (e legado sem autor NÃO acusa)", () => {
    const r = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            proposta: { ...PROPOSTA_SINTETICA, originAuthor: "outra-pessoa" },
          }),
        ],
      }),
    );
    expect(soContradicoes(r)).toContain("ORIGEM_DE_OUTRA_PESSOA");

    // Regime histórico (§16): declaredBy nulo é anterior ao regime de autoria —
    // o confronto só acontece quando os dois lados existem.
    const legado = montarCadeiaDeProveniencia({
      subcriterionCode: "MODELO_COMUNICACAO",
      pessoa: {
        declaracao: { degree: "ESSENCIAL", options: ["A"], declaredBy: null, declaredAt: null },
        importancia: { importance: "MUITO_IMPORTANTE", declaredBy: null, registradoEm: null },
        proposta: { ...PROPOSTA_SINTETICA, originVersion: "ESSENCIAL" },
      },
      profissional: { estado: null, evidencia: null },
    });
    const rLegado = construirFicha(entrada({ cadeias: [legado] }));
    expect(soContradicoes(rLegado)).not.toContain("ORIGEM_DE_OUTRA_PESSOA");
  });

  it("7 · declaração redeclarada depois da emissão → ORIGEM_SUPERADA (S1)", () => {
    const r = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            degree: "PESA_MUITO",
            proposta: { ...PROPOSTA_SINTETICA, originVersion: "ESSENCIAL" },
          }),
        ],
      }),
    );
    expect(soContradicoes(r)).toContain("ORIGEM_SUPERADA");
    expect(r.ficha.status.R1.exibivel).toBe(false);
  });

  it("8/9 · evidência de outro profissional ou conceito → EVIDENCIA_DIVERGENTE no ramo estado", () => {
    const deOutroProfissional = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            evidencia: { ...EVIDENCIA_SINTETICA, professionalProfileId: "outro-profissional" },
          }),
        ],
      }),
    );
    expect(soContradicoes(deOutroProfissional)).toContain("EVIDENCIA_DIVERGENTE");
    expect([...new Set(deOutroProfissional.bloqueios.map((b) => b.afirmacao))].sort()).toEqual([
      "R1",
      "R5",
      "R6",
    ]);

    const deOutroConceito = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            evidencia: { ...EVIDENCIA_SINTETICA, subcriterionCode: "MODELO_ALTERNATIVAS" },
          }),
        ],
      }),
    );
    expect(soContradicoes(deOutroConceito)).toContain("EVIDENCIA_DIVERGENTE");
  });

  it("12 · TODO bloqueio de inconsistência carrega discriminador — e o enum não tem membro morto", () => {
    // O tipo já torna a omissão incompilável; aqui a prova em execução, e a de
    // que cada discriminador do enum é ALCANÇÁVEL por algum cenário.
    const cenarios: Record<
      (typeof CONTRADICOES_DE_PROVENIENCIA)[number],
      ReturnType<typeof construirFicha>
    > = {
      PROPOSTA_INEXISTENTE: construirFicha(
        entrada({
          cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: null })],
          afirmacoes: [{ subcriterionCode: "MODELO_COMUNICACAO", ruleId: "x" }],
        }),
      ),
      PROPOSTA_DE_OUTRA_REGRA: construirFicha(
        entrada({
          cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA })],
          afirmacoes: [{ subcriterionCode: "MODELO_COMUNICACAO", ruleId: "outra" }],
        }),
      ),
      PROPOSTA_DE_OUTRA_VERSAO: construirFicha(
        entrada({
          cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA })],
          afirmacoes: [{ subcriterionCode: "MODELO_COMUNICACAO", ruleVersion: 99 }],
        }),
      ),
      ALVO_DIVERGENTE: construirFicha(
        entrada({
          cadeias: [cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA })],
          afirmacoes: [
            {
              subcriterionCode: "MODELO_COMUNICACAO",
              ruleId: "regra-sintetica",
              propostaId: "outra-proposta",
            },
          ],
        }),
      ),
      ORIGEM_DE_OUTRA_PESSOA: construirFicha(
        entrada({
          cadeias: [
            cadeiaDe("MODELO_COMUNICACAO", {
              proposta: { ...PROPOSTA_SINTETICA, originAuthor: "outra-pessoa" },
            }),
          ],
        }),
      ),
      ORIGEM_SUPERADA: construirFicha(
        entrada({
          cadeias: [
            cadeiaDe("MODELO_COMUNICACAO", {
              degree: "PESA_MUITO",
              proposta: { ...PROPOSTA_SINTETICA, originVersion: "ESSENCIAL" },
            }),
          ],
        }),
      ),
      CONCEITO_DIVERGENTE: construirFicha(
        entrada({
          cadeias: [
            cadeiaDe("MODELO_COMUNICACAO", {
              proposta: { ...PROPOSTA_SINTETICA, subcriterionCode: "MODELO_ALTERNATIVAS" },
            }),
          ],
        }),
      ),
      EVIDENCIA_DIVERGENTE: construirFicha(
        entrada({
          cadeias: [
            cadeiaDe("MODELO_COMUNICACAO", {
              evidencia: { ...EVIDENCIA_SINTETICA, professionalProfileId: "outro" },
            }),
          ],
        }),
      ),
    };

    for (const [contradicao, r] of Object.entries(cenarios)) {
      const inconsistencias = r.bloqueios.filter((b) => b.motivo === "PROVENIENCIA_INCONSISTENTE");
      expect(inconsistencias.length, `${contradicao} não foi alcançado`).toBeGreaterThan(0);
      for (const b of inconsistencias) {
        expect("contradicao" in b && b.contradicao, "inconsistência sem discriminador").toBeTruthy();
      }
      expect(
        inconsistencias.map((b) => ("contradicao" in b ? b.contradicao : null)),
        contradicao,
      ).toContain(contradicao);
    }
  });
});

// ===========================================================================
// §19 — o bloqueio é POR AFIRMAÇÃO, não Ficha inteira
// ===========================================================================

describe("§19 · R1 bloqueada, R2 e R4 de pé — e cada vocabulário respeita", () => {
  it("legado sem evidência: R1 cai, R2/R4/R5 continuam, e as superfícies suprimem só R1/R3/R6", () => {
    const foraDoMotor = conceitosForaDoMotor()[0]!;
    const r = construirFicha(
      entrada({
        leitura: {
          rows: [
            {
              subcriterionCode: "MODELO_COMUNICACAO",
              importance: "MUITO_IMPORTANTE",
              status: "CONFIRMADO",
              result: "ALTA_COMPATIBILIDADE",
            },
            {
              subcriterionCode: foraDoMotor,
              importance: "MUITO_IMPORTANTE",
              status: "CONFIRMADO",
              result: "NAO_RELEVANTE",
            },
          ],
          summary: {
            totalSubcriteria: 2,
            highCompatibility: 1,
            mediumCompatibility: 0,
            informationGaps: 0,
            notRelevant: 1,
            gapsWithoutAnyRecord: 0,
            notDeclaredByCase: 0,
          },
        },
        cadeias: [cadeiaDe("MODELO_COMUNICACAO", { evidencia: null }), cadeiaDe(foraDoMotor)],
      }),
    );

    expect(r.ficha.status.R1.exibivel).toBe(false);
    expect(r.ficha.status.R2.exibivel).toBe(true);
    expect(r.ficha.status.R4.exibivel).toBe(true);
    expect(r.ficha.status.R5.exibivel).toBe(true);

    // R4 metodológica continua com conteúdo — o fato é do Catálogo.
    expect(
      r.ficha.respostas.criteriosQueNaoInfluenciaram.find(
        (m) => m.subcriterionCode === foraDoMotor,
      )?.motivo,
    ).toBe("FORA_DO_MOTOR_POR_METODO");

    // Mesa: R1 suprimida COM NOME; R2 e R4 intactas.
    const mesa = paraMesa(r.ficha);
    expect(mesa.porQueFoiEscolhida).toEqual(["AFIRMACAO_NAO_EXIBIVEL — ver bloqueios da leitura"]);
    expect(mesa.porQueNestaPosicao).toMatch(/não há posição/i);
    expect(mesa.criteriosQueNaoInfluenciaram.length).toBeGreaterThan(0);

    // Paciente: nada some em silêncio, nada técnico aparece.
    const paciente = paraPaciente(r.ficha);
    expect(paciente.porQueApareceu).toEqual([]);
    expect(paciente.sobreAOrdem).toMatch(/não quer dizer nada/i);
    const texto = Object.values(paciente).flat().join(" ");
    expect(texto).not.toContain("SEM_EVIDENCIA_VINCULADA");
    expect(texto).not.toContain("R1");
  });

  it("a paciente nunca recebe discriminador técnico, nem com tudo bloqueado", () => {
    const r = construirFicha(
      entrada({
        cadeias: [
          cadeiaDe("MODELO_COMUNICACAO", {
            degree: "PESA_MUITO",
            proposta: { ...PROPOSTA_SINTETICA, originVersion: "ESSENCIAL" },
            evidencia: null,
          }),
        ],
      }),
    );
    expect(r.integral).toBe(false);

    const texto = JSON.stringify(paraPaciente(r.ficha));
    for (const tecnico of [
      ...CONTRADICOES_DE_PROVENIENCIA,
      "PROVENIENCIA_INCONSISTENTE",
      "SEM_EVIDENCIA_VINCULADA",
      "regra-sintetica",
    ]) {
      expect(texto, `vazou para a paciente: ${tecnico}`).not.toContain(tecnico);
    }
    expect(paraPaciente(r.ficha).sobreAsInformacoes).toMatch(/ainda não pode ser mostrada/);
  });
});

// ===========================================================================
// A2/A3 — a Ficha explica, não decide · e a cadeia é ÚNICA
// ===========================================================================

describe("A2 · a Ficha explica, nunca decide", () => {
  it("não cria importância, não altera resultado, não reordena", () => {
    const base = entrada();
    const ficha = fichaOk();
    expect(ficha.respostas.criteriosQueInfluenciaram.map((c) => c.resultado)).toEqual(
      base.leitura.rows.map((r) => r.result),
    );
    expect(ficha.respostas.porQueFoiEscolhida.map((c) => c.degreeDela)).toEqual(["ESSENCIAL"]);
  });

  it("a proveniência da Ficha É a cadeia — o mesmo objeto, nunca uma cópia", () => {
    const cadeia = cadeiaDe("MODELO_COMUNICACAO", { proposta: PROPOSTA_SINTETICA });
    const r = construirFicha(entrada({ cadeias: [cadeia] }));
    expect(r.integral).toBe(true);
    expect(r.ficha.cadeias[0]).toBe(cadeia);
    expect(r.ficha.cadeias[0]!.fatos.proposta).toBe(cadeia.fatos.proposta);
  });

  it("é determinística: mesma entrada, mesma saída", () => {
    expect(JSON.stringify(construirFicha(entrada()))).toBe(
      JSON.stringify(construirFicha(entrada())),
    );
  });

  it("conceito fora do Motor nunca vira correspondência", () => {
    for (const code of conceitosForaDoMotor()) {
      const ficha = fichaOk({
        leitura: {
          rows: [
            {
              subcriterionCode: code,
              importance: "MUITO_IMPORTANTE",
              status: "CONFIRMADO",
              result: "NAO_RELEVANTE",
            },
          ],
          summary: {
            totalSubcriteria: 1,
            highCompatibility: 0,
            mediumCompatibility: 0,
            informationGaps: 0,
            notRelevant: 1,
            gapsWithoutAnyRecord: 0,
            notDeclaredByCase: 0,
          },
        },
        cadeias: [cadeiaDe(code)],
      });
      expect(ficha.respostas.porQueFoiEscolhida).toEqual([]);
      expect(
        ficha.respostas.criteriosQueNaoInfluenciaram.find((m) => m.subcriterionCode === code)
          ?.motivo,
      ).toBe("FORA_DO_MOTOR_POR_METODO");
    }
  });

  it("os conceitos citados existem no Catálogo — a Ficha não inventa conceito", () => {
    const ativos = new Set(CATALOGO_GERADO.map((c) => c.code));
    const ficha = fichaOk();
    for (const grupo of [
      ficha.respostas.criteriosQueInfluenciaram,
      ficha.respostas.criteriosQueNaoInfluenciaram,
      ficha.respostas.lacunas,
    ]) {
      for (const item of grupo) expect(ativos.has(item.subcriterionCode)).toBe(true);
    }
  });
});
