import { describe, expect, it } from "vitest";

import {
  validatePracticeEvidence,
  verbalizePracticeEvidence,
} from "@/modules/curadoria/evidencias-pratica";
import { validatePersonNeed } from "@/modules/curadoria/protocolos";

/**
 * OS DEZ CENÁRIOS DA MISSÃO — simulados no domínio puro.
 *
 * Cada cenário compõe as portas reais (validação da evidência, validação da
 * necessidade, verbalização) e pina o que a Etapa 9 exige das frases: só o
 * selecionado, sem adjetivo, sem concluir qualidade, sem transformar
 * declaração em verificação, sem prometer correspondência.
 */

const base = {
  details: {},
  conditionNote: null,
  observation: null,
  sourceTier: "INSTITUCIONAL" as const,
  source: "Autodeclaração pelo Protocolo da Prática Profissional",
};

describe("Cenários dos Protocolos", () => {
  it("1. profissional presencial com disponibilidade restrita", () => {
    expect(
      validatePracticeEvidence({ ...base, subcriterionCode: "ACESSO_MODALIDADE", options: ["PRESENCIAL"] }),
    ).toEqual([]);
    const frase = verbalizePracticeEvidence({
      subcriterionCode: "ACESSO_DISPONIBILIDADE",
      options: ["MANHA_DIAS_UTEIS"],
      details: {}, conditionNote: null, status: "nao_verificado", verifiedAt: null,
    })!;
    expect(frase.text).toBe(
      "Disponibilidade — prática registrada: Manhã em dias úteis (declarado, ainda não verificado).",
    );
  });

  it("2. profissional remoto com condição para a primeira consulta — a condição vai na frase, dita como condição", () => {
    const input = {
      ...base,
      subcriterionCode: "ACESSO_MODALIDADE",
      options: ["PRIMEIRA_REMOTA_CONDICIONADA"],
      conditionNote: "Após análise prévia da documentação clínica",
    };
    expect(validatePracticeEvidence(input)).toEqual([]);
    const frase = verbalizePracticeEvidence({
      subcriterionCode: input.subcriterionCode,
      options: input.options,
      details: {},
      conditionNote: input.conditionNote,
      status: "nao_verificado",
      verifiedAt: null,
    })!;
    expect(frase.text).toContain("condição: Após análise prévia da documentação clínica");
    expect(frase.text).not.toMatch(/sempre|garantido|com certeza/i);
  });

  it("3. profissional com acompanhamento longitudinal", () => {
    expect(
      validatePracticeEvidence({
        ...base,
        subcriterionCode: "CONTINUIDADE_RETORNOS",
        options: ["RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA", "ENVIA_ORIENTACAO_ESCRITA"],
      }),
    ).toEqual([]);
  });

  it("4. profissional procedimental com seguimento delimitado — o limite é dito, nunca julgado", () => {
    const frase = verbalizePracticeEvidence({
      subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO",
      options: ["ACOMPANHA_ATE_ALTA_E_ENCAMINHA"],
      details: {}, conditionNote: null, status: "verificado", verifiedAt: "2026-08-01T00:00:00.000Z",
    })!;
    expect(frase.text).toContain("Acompanha até a alta e encaminha");
    expect(frase.text).not.toMatch(/apenas|somente|infelizmente|limitado/i);
  });

  it("5. profissional com limites específicos de atuação — proteção dita como fato", () => {
    expect(
      validatePracticeEvidence({
        ...base,
        subcriterionCode: "PRATICA_LIMITES_DE_ATUACAO",
        options: ["ENCAMINHA_COM_INDICACAO"],
        details: { situacoes: ["Oncologia pediátrica"] },
      }),
    ).toEqual([]);
    // Sem details, o conceito recusa: limite sem dizer qual não protege ninguém.
    expect(
      validatePracticeEvidence({
        ...base,
        subcriterionCode: "PRATICA_LIMITES_DE_ATUACAO",
        options: ["ENCAMINHA_COM_INDICACAO"],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("campos estruturados")]));
  });

  it("6. pessoa com necessidade essencial de modalidade", () => {
    expect(
      validatePersonNeed({
        subcriterionCode: "ACESSO_MODALIDADE",
        options: ["PRECISO_REMOTO"],
        degree: "ESSENCIAL",
        flexibility: "Não aceita presencial",
        guidedText: null,
        origin: "DIRETO",
        proposedReading: null,
      }),
    ).toEqual([]);
  });

  it("7. pessoa flexível sobre frequência de retorno", () => {
    expect(
      validatePersonNeed({
        subcriterionCode: "CONTINUIDADE_RETORNOS",
        options: ["RETORNO_CONFORME_EU_EVOLUIR"],
        degree: "DESEJAVEL",
        flexibility: null,
        guidedText: null,
        origin: "TRADUCAO",
        proposedReading: "Entendi que a frequência do retorno não pesa tanto — é isso?",
      }),
    ).toEqual([]);
  });

  it("8. pessoa que corrige a leitura do Curador — tradução exige a leitura para haver o que corrigir", () => {
    expect(
      validatePersonNeed({
        subcriterionCode: "MODELO_COMUNICACAO",
        options: ["ALGO_ESCRITO_PARA_LEVAR"],
        degree: "PESA_MUITO",
        flexibility: null,
        guidedText: null,
        origin: "TRADUCAO",
        proposedReading: null,
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("leitura proposta")]));
  });

  it("9. barreira de convênio — a operadora é obrigatória dos dois lados", () => {
    expect(
      validatePracticeEvidence({
        ...base,
        subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO",
        options: ["CONVENIOS_SELECIONADOS"],
        details: { operadoras: ["Operadora X"] },
      }),
    ).toEqual([]);
    // E viabilidade NUNCA vira frase automática — a barreira é conversa do
    // Curador, não sentença do sistema.
    expect(
      verbalizePracticeEvidence({
        subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO",
        options: ["EXCLUSIVAMENTE_PARTICULAR"],
        details: {}, conditionNote: null, status: "verificado", verifiedAt: "2026-08-01T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("10. custo não informado pela pessoa — PREFIRO_NAO_INFORMAR é resposta completa", () => {
    expect(
      validatePersonNeed({
        subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO",
        options: ["PREFIRO_NAO_INFORMAR"],
        degree: "SEM_PREFERENCIA",
        flexibility: null,
        guidedText: null,
        origin: "DIRETO",
        proposedReading: null,
      }),
    ).toEqual([]);
  });
});

describe("Fidelidade das frases (Etapa 9)", () => {
  const evidencia = {
    subcriterionCode: "MODELO_COMUNICACAO",
    options: ["ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR", "ENVIA_RESUMO_ESCRITO"],
    details: {},
    conditionNote: null,
  };

  it("a frase contém só o selecionado — nada de conclusão de qualidade", () => {
    const frase = verbalizePracticeEvidence({
      ...evidencia, status: "nao_verificado", verifiedAt: null,
    })!;
    expect(frase.text).toContain("Adapta a linguagem ao interlocutor");
    expect(frase.text).toContain("Envia resumo escrito");
    expect(frase.text).not.toMatch(/boa comunicação|se comunica bem|excelente|claro e acessível/i);
  });

  it("declaração nunca vira verificação na frase", () => {
    const declarada = verbalizePracticeEvidence({
      ...evidencia, status: "nao_verificado", verifiedAt: null,
    })!;
    expect(declarada.text).toContain("declarado, ainda não verificado");
    expect(declarada.text).not.toContain("verificado em");
  });

  it("nenhuma frase promete que a necessidade será atendida", () => {
    const frase = verbalizePracticeEvidence({
      ...evidencia, status: "verificado", verifiedAt: "2026-08-01T00:00:00.000Z",
    })!;
    expect(frase.text).not.toMatch(/atende|corresponde|ideal para|combina com/i);
  });

  it("a proveniência da frase identifica conceito e estado", () => {
    const frase = verbalizePracticeEvidence({
      ...evidencia, status: "verificado", verifiedAt: "2026-08-01T00:00:00.000Z",
    })!;
    expect(frase.ref).toEqual({
      sourceType: "evidencia_de_pratica",
      subcriterion: "MODELO_COMUNICACAO",
      status: "verificado",
      verifiedAt: "2026-08-01T00:00:00.000Z",
    });
  });
});
