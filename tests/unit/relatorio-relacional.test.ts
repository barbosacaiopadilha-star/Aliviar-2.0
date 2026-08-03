/**
 * RELATÓRIO — A SEÇÃO RELACIONAL (ADR-065, documento normativo Parte 6).
 *
 * O que se pina: toda frase é verbalização de um par rastreado; conceito
 * humano entra como estado e exige o Curador; a ordem é grau desc + Catálogo;
 * NAO_RELEVANTE não fala; lacunas relacionais entram nos pontos de atenção;
 * nenhuma frase proibida nasce aqui.
 */

import { describe, expect, it } from "vitest";

import { crossRelational, type RelationalNeed } from "@/modules/curadoria/motor-relacional";
import {
  FRASE_SENTINELA_JUIZO,
  generateReportDraft,
  pendenciasDeJuizoRelacional,
  type DraftInput,
  type OptionDraftInput,
} from "@/modules/curadoria/relatorio-inteligente";

const IDS = [
  "00000000-0000-0000-0000-0000000000b1",
  "00000000-0000-0000-0000-0000000000b2",
  "00000000-0000-0000-0000-0000000000b3",
];

const NEEDS: RelationalNeed[] = [
  { subcriterionCode: "MODELO_COMUNICACAO", options: ["QUE_CONFIRMEM_SE_ENTENDI", "ALGO_ESCRITO_PARA_LEVAR"], degree: "ESSENCIAL" },
  { subcriterionCode: "MODELO_ALTERNATIVAS", options: ["RISCOS_DE_CADA_CAMINHO"], degree: "DESEJAVEL" },
  { subcriterionCode: "MODELO_DECISAO_COMPARTILHADA", options: ["QUERO_DECIDIR_COM_ORIENTACAO"], degree: "PESA_MUITO" },
  { subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", options: ["QUERO_ACOMPANHANTE_SEMPRE"], degree: "SEM_PREFERENCIA" },
];

function opcaoCom(id: string, evidence: Map<string, { subcriterionCode: string; options: string[] }>): OptionDraftInput {
  return {
    professionalProfileId: id,
    states: [],
    areaDeclaration: {
      compatibility: "COMPATIVEL",
      rationale: null,
      declaredBy: "curador",
      declaredAt: "2026-08-03T00:00:00.000Z",
    },
    openCriticalDivergences: 0,
    relationalReadings: crossRelational(NEEDS, evidence).readings,
  };
}

const EVIDENCIA_COMPLETA = new Map([
  [
    "MODELO_COMUNICACAO",
    {
      subcriterionCode: "MODELO_COMUNICACAO",
      options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU", "ENVIA_RESUMO_ESCRITO"],
    },
  ],
  ["MODELO_ALTERNATIVAS", { subcriterionCode: "MODELO_ALTERNATIVAS", options: ["RISCOS_DE_CADA_CAMINHO"] }],
]);

const EVIDENCIA_PARCIAL = new Map([
  [
    "MODELO_COMUNICACAO",
    { subcriterionCode: "MODELO_COMUNICACAO", options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU"] },
  ],
]);

function draftInput(evidencias: Map<string, { subcriterionCode: string; options: string[] }>[]): DraftInput {
  return {
    areaRequirement: null,
    priorities: [],
    options: IDS.map((id, i) => opcaoCom(id, evidencias[i] ?? new Map())),
  };
}

describe("A seção relacional do rascunho", () => {
  const draft = generateReportDraft(
    draftInput([EVIDENCIA_COMPLETA, EVIDENCIA_PARCIAL, new Map()]),
  );
  const [completa, parcial, semRegistro] = draft.options;

  it("correspondência vira verbalização do par — nunca inferência nem adjetivo", () => {
    expect(completa!.leituraRelacional.text).toContain(
      "Para você é essencial que confirmem se eu entendi. Este profissional declara que verifica se a pessoa compreendeu.",
    );
    expect(completa!.leituraRelacional.text).toContain(
      "Para você é essencial algo escrito para levar. Este profissional declara que envia resumo escrito.",
    );
  });

  it("conduta não declarada em pergunta respondida é fato dito — sem eliminar, sem concluir", () => {
    expect(parcial!.leituraRelacional.text).toContain(
      "Para você é essencial algo escrito para levar. Essa conduta não está entre as declaradas por este profissional.",
    );
  });

  it("sem registro, a frase diz o estado — nunca descreve a prática", () => {
    expect(semRegistro!.leituraRelacional.text).toContain(
      "Ainda não há registro sobre como este profissional conduz esse ponto.",
    );
  });

  it("conceito humano entra como estado e acende requiresCurator", () => {
    for (const option of draft.options) {
      expect(option!.leituraRelacional.text).toContain(
        "Sobre como conduz decisões: esta leitura aguarda a conversa com o Curador.",
      );
      expect(option!.leituraRelacional.requiresCurator).toBe(true);
    }
  });

  it("SEM_PREFERENCIA não fala — participação familiar não gera frase", () => {
    for (const option of draft.options) {
      expect(option!.leituraRelacional.text).not.toMatch(/acompanhante/i);
    }
  });

  it("a ordem é grau desc, empate pela ordem do Catálogo", () => {
    const texto = completa!.leituraRelacional.text;
    const posEssencial = texto.indexOf("Para você é essencial");
    const posJuizo = texto.indexOf("Sobre como conduz decisões");
    const posDesejavel = texto.indexOf("Você disse que seria bem-vindo");
    expect(posEssencial).toBeGreaterThanOrEqual(0);
    expect(posJuizo).toBeGreaterThan(posEssencial);
    expect(posDesejavel).toBeGreaterThan(posJuizo);
  });

  it("toda frase declara os identificadores canônicos que a originaram", () => {
    for (const sentence of completa!.leituraRelacional.sentences) {
      expect(sentence.provenance[0]!.sourceType).toBe("leitura_relacional");
      expect(sentence.provenance[0]!.subcriterion).toMatch(/^MODELO_/);
    }
  });

  it("lacunas relacionais entram nos pontos de atenção", () => {
    const atencao = semRegistro!.pontosDeAtencao.items.map((item) => item.text).join("\n");
    expect(atencao).toContain("ainda não há registro — vale levantar na conversa");
  });

  it("nenhuma frase proibida: sem adjetivo, percentual, contagem comparativa ou pódio", () => {
    for (const option of draft.options) {
      expect(option!.leituraRelacional.text).not.toMatch(
        /excelente|ótim|melhor|acolhedor|humanizad|%|mais compatível|atende ao seu perfil/i,
      );
    }
  });

  it("B-1 — correspondência universal tem frase própria: nada de listar condutas que soariam como contradição", () => {
    const needsSozinha: RelationalNeed[] = [
      {
        subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR",
        options: ["PREFIRO_SOZINHA"],
        degree: "ESSENCIAL",
      },
    ];
    const evidencia = new Map([
      [
        "MODELO_PARTICIPACAO_FAMILIAR",
        { subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", options: ["ATENDIMENTO_APENAS_INDIVIDUAL"] },
      ],
    ]);
    const rascunho = generateReportDraft({
      areaRequirement: null,
      priorities: [],
      options: IDS.map((id) => ({
        professionalProfileId: id,
        states: [],
        areaDeclaration: {
          compatibility: "COMPATIVEL",
          rationale: null,
          declaredBy: "curador",
          declaredAt: "2026-08-03T00:00:00.000Z",
        },
        openCriticalDivergences: 0,
        relationalReadings: crossRelational(needsSozinha, evidencia).readings,
      })),
    });

    const texto = rascunho.options[0]!.leituraRelacional.text;
    expect(texto).toContain(
      "Para você é essencial prefiro sozinha. Nada nas condutas declaradas por este profissional impede isso.",
    );
    // A frase antiga — que verbalizava as condutas — não pode voltar.
    expect(texto).not.toMatch(/declara que atendimento apenas individual/i);
    // Rastreabilidade preservada: proveniência com conceito e resultado.
    const frase = rascunho.options[0]!.leituraRelacional.sentences[0]!;
    expect(frase.provenance[0]).toMatchObject({
      sourceType: "leitura_relacional",
      subcriterion: "MODELO_PARTICIPACAO_FAMILIAR",
      compatibility: "ALTA_COMPATIBILIDADE",
    });
  });

  it("B-1 — a guarda de emissão reconhece EXATAMENTE o que o gerador escreve (acoplamento à prova de deriva)", () => {
    // O texto gerado (com sentinelas de decisão compartilhada e preferências)
    // é detectado pela mesma função que a action de emissão consulta.
    const pendencias = pendenciasDeJuizoRelacional(
      draft.options.map((option) => ({
        professionalProfileId: option.professionalProfileId,
        relationalReading: option.leituraRelacional.text,
      })),
    );
    expect(pendencias.length).toBeGreaterThan(0);
    expect(pendencias.map((p) => p.conceito)).toContain("como conduz decisões");
    // A constante e a linha gerada não podem divergir.
    expect(completa!.leituraRelacional.text).toContain(FRASE_SENTINELA_JUIZO);
  });

  it("B-1 — emissão permitida: texto reescrito pelo Curador não tem pendência; vazio e null também não", () => {
    expect(
      pendenciasDeJuizoRelacional([
        {
          professionalProfileId: IDS[0]!,
          relationalReading:
            "Você disse que quer decidir, com orientação. As condutas declaradas sustentam o tipo de participação que você pediu.",
        },
        { professionalProfileId: IDS[1]!, relationalReading: "" },
        { professionalProfileId: IDS[2]!, relationalReading: null },
      ]),
    ).toEqual([]);
  });

  it("B-1 — emissão bloqueada: cada linha-sentinela vira uma pendência nomeando o conceito", () => {
    const pendencias = pendenciasDeJuizoRelacional([
      {
        professionalProfileId: IDS[0]!,
        relationalReading: [
          "Para você é essencial que confirmem se eu entendi. Este profissional declara que verifica se a pessoa compreendeu.",
          `Sobre como conduz decisões: ${FRASE_SENTINELA_JUIZO}.`,
          `Sobre respeito a recusas e restrições: ${FRASE_SENTINELA_JUIZO}.`,
        ].join("\n"),
      },
    ]);
    expect(pendencias).toEqual([
      { professionalProfileId: IDS[0]!, conceito: "como conduz decisões" },
      { professionalProfileId: IDS[0]!, conceito: "respeito a recusas e restrições" },
    ]);
  });

  it("sem bloco relacional respondido, a seção nasce vazia e não inventa", () => {
    const semRelacional = generateReportDraft({
      areaRequirement: null,
      priorities: [],
      options: IDS.map((id) => ({
        professionalProfileId: id,
        states: [],
        areaDeclaration: {
          compatibility: "COMPATIVEL",
          rationale: null,
          declaredBy: "curador",
          declaredAt: "2026-08-03T00:00:00.000Z",
        },
        openCriticalDivergences: 0,
      })),
    });
    for (const option of semRelacional.options) {
      expect(option.leituraRelacional.text).toBe("");
      expect(option.leituraRelacional.sentences).toHaveLength(0);
    }
  });
});
