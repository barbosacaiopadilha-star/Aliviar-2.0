import { describe, expect, it } from "vitest";

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { p002CaseBuilder } from "@/modules/ace/protocols/p002-case-builder";
import {
  applyP002Completeness,
  classifyP002CatalogFields,
  classifyP002Field,
  sanitizeP002MissingInformation,
} from "@/modules/ace/protocols/p002-completeness";

describe("P002 — Motor de Completude", () => {
  it("classifica especialidade como determinada pelo caso", () => {
    expect(classifyP002Field("especialidade", "Busca orientação para dor crônica.")).toBe(
      "determinado_pelo_caso",
    );
  });

  it("trata exames negados como respondido, sem pendência", () => {
    const narrative = createNarrative({
      text: "O paciente informou que não realizou exames até o momento.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const sanitized = sanitizeP002MissingInformation(narrative, [
      {
        description: "Exames realizados ainda não foram informados.",
        relatedField: "other",
      },
    ]);

    expect(sanitized).toHaveLength(0);
    expect(classifyP002Field("exames", narrative.text)).toBe("respondido");
  });

  it("não gera pendência de preço da consulta na Consulta Inicial", () => {
    const narrative = createNarrative({
      text: "Busca apoio para decidir o próximo passo do cuidado.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const sanitized = sanitizeP002MissingInformation(narrative, [
      {
        description: "Preço da consulta não foi informado.",
        relatedField: "other",
      },
    ]);

    expect(sanitized).toHaveLength(0);
    expect(classifyP002Field("preco_consulta", narrative.text)).toBe("nao_se_aplica");
  });

  it("não cria pendência automática para outras doenças sem relato", () => {
    const narrative = createNarrative({
      text: "Relata dor no joelho há seis meses, sem outras queixas citadas.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const sanitized = sanitizeP002MissingInformation(narrative, [
      {
        description: "Outras doenças não foram relatadas.",
        relatedField: "other",
      },
    ]);

    expect(sanitized).toHaveLength(0);
    expect(classifyP002Field("outras_doencas", narrative.text)).toBe("respondido");
  });

  it("preserva lacunas essenciais de decisão e objetivo", () => {
    const narrative = createNarrative({
      text: "História longa, sem decisão clara ainda.",
      closingQuestionsAnswered: { historia: true, decisao: false, objetivo: false },
    });

    const sanitized = sanitizeP002MissingInformation(narrative, [
      {
        description: "A decisão específica ainda não está definida.",
        relatedField: "decision",
      },
      {
        description: "Especialidade médica não informada.",
        relatedField: "other",
      },
    ]);

    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]?.relatedField).toBe("decision");
  });

  it("integra a sanitização na construção do DecisionCase", async () => {
    const narrative = createNarrative({
      text: "O paciente disse que não realizou exames e busca um segundo parecer.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const decisionCase = await p002CaseBuilder.execute({
      narrative,
      extractedFields: {
        decisionStatement: {
          decision: "Buscar um segundo parecer.",
          goal: "Entender as opções com mais clareza.",
          sourceType: "fato_relatado",
        },
        mandatoryConstraints: [],
        preferences: [],
        missingInformation: [
          {
            description: "Exames realizados não foram descritos.",
            relatedField: "other",
          },
          {
            description: "Preço da consulta não foi mencionado.",
            relatedField: "other",
          },
        ],
      },
    });

    expect(decisionCase.missingInformation).toHaveLength(0);
  });

  it("expõe classificação do catálogo canônico de campos", () => {
    const narrative = createNarrative({
      text: "Sem relato de outras doenças.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const catalog = classifyP002CatalogFields(narrative);
    expect(catalog.find((entry) => entry.field === "especialidade")?.state).toBe(
      "determinado_pelo_caso",
    );
    expect(catalog.find((entry) => entry.field === "preco_consulta")?.state).toBe("nao_se_aplica");
  });

  it("remove lacunas genéricas não mapeadas (falsos positivos)", () => {
    const narrative = createNarrative({
      text: "História completa para decisão.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const result = applyP002Completeness(narrative, {
      decisionStatement: {
        decision: "Decidir próximo passo.",
        goal: "Mais clareza.",
        sourceType: "fato_relatado",
      },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [
        {
          description: "Informação complementar não especificada.",
          relatedField: "other",
        },
      ],
    });

    expect(result.missingInformation).toHaveLength(0);
  });
});
