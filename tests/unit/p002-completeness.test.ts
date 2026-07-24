import { describe, expect, it } from "vitest";

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { p002CaseBuilder } from "@/modules/ace/protocols/p002-case-builder";
import {
  applyP002Completeness,
  classifyP002CatalogFields,
  classifyP002FieldState,
  filterUnsourcedMandatoryConstraints,
  inferP002TechnicalHypotheses,
  sanitizeP002MissingInformation,
} from "@/modules/ace/protocols/p002-completeness";
import type { P002CompletenessFieldId } from "@/modules/ace/protocols/p002-completeness";
import {
  applyHumanCorrection,
  mergeRegeneratedWithHumanOverrides,
  resolveFieldStateWithOverrides,
} from "@/modules/ace/protocols/p002-human-overrides";
import { computePriorityValidationReadiness } from "@/modules/curadoria/priority-validation-readiness";

function narrative(text: string, historia = true) {
  return createNarrative({
    text,
    closingQuestionsAnswered: { historia, decisao: true, objetivo: true },
  });
}

describe("P002 — Motor de Completude (regressão A–I)", () => {
  // Cenário A — exames negados
  it("A: 'Não fiz nenhum exame' é informação conhecida, não ausente", () => {
    const n = narrative("O paciente declarou: não fiz nenhum exame.");
    expect(classifyP002FieldState("exames", n)).toBe("ausencia_declarada");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Exames não informados.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  // Cenário B — exames não perguntados
  it("B: exames não perguntados ficam como nao_perguntado", () => {
    const n = narrative("História sem menção a exames.", false);
    expect(classifyP002FieldState("exames", n)).toBe("nao_perguntado");
  });

  // Cenário C — especialidade
  it("C: especialidade não gera pendência; gera hipótese técnica", () => {
    const n = narrative("Dor no joelho há seis meses, sem saber qual especialista procurar.");
    expect(classifyP002FieldState("especialidade", n)).toBe("determinado_pelo_caso");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Especialidade não informada pelo paciente.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
    expect(inferP002TechnicalHypotheses(n).length).toBeGreaterThan(0);
  });

  // Cenário D — atendimento anterior
  it("D: já passou por especialista é conhecido, não ausente", () => {
    const n = narrative("Já passou por um médico especialista, mas não lembra o nome.");
    expect(classifyP002FieldState("atendimento_anterior", n)).toBe("conhecido");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Detalhes do atendimento anterior não informados.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  // Cenário E — outras condições não mencionadas
  it("E: não mencionar outras condições não cria pendência nem negação", () => {
    const n = narrative("Relata dor no joelho há seis meses.");
    expect(classifyP002FieldState("outras_doencas", n)).toBe("desconhecido");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Outras doenças não foram relatadas.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  // Cenário F — negação explícita de outras doenças
  it("F: 'Não tenho outras doenças' é ausência declarada", () => {
    const n = narrative("Não tenho outras doenças conhecidas.");
    expect(classifyP002FieldState("outras_doencas", n)).toBe("ausencia_declarada");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Outras condições de saúde ausentes.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  // Cenário G — preferência não obrigatória
  it("G: valor da consulta é nao_se_aplica", () => {
    const n = narrative("Busca orientação para próximo passo.");
    expect(classifyP002FieldState("preco_consulta", n)).toBe("nao_se_aplica");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "Valor da consulta não informado.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  // Cenário H — restrição sem evidência
  it("H: restrição sem evidência é rejeitada", () => {
    const filtered = filterUnsourcedMandatoryConstraints([
      { description: "Precisa ser presencial", originEvidence: { quote: "" } },
      { description: "Precisa ser em SP", originEvidence: { quote: "mora em São Paulo" } },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.description).toBe("Precisa ser em SP");
  });

  // Cenário I — correção humana preservada
  it("I: correção humana prevalece sobre regeneração", () => {
    const store = applyHumanCorrection(
      { executionId: "exec-1", corrections: [] },
      {
        field: "exames",
        estado: "conhecido",
        motivo: "Curador confirmou com paciente.",
        corrigidoPor: "curador-1",
      },
    );
    const regenerated = new Map<P002CompletenessFieldId, import("@/modules/ace/core/information-state").EstadoInformacao>([
      ["exames", "desconhecido"],
    ]);
    const merged = mergeRegeneratedWithHumanOverrides(regenerated, store.corrections);
    expect(merged.get("exames")).toBe("conhecido");
    expect(
      resolveFieldStateWithOverrides("exames", "desconhecido", store.corrections),
    ).toBe("conhecido");
  });

  it("preserva lacunas essenciais de decisão e objetivo", () => {
    const n = narrative("História longa, sem decisão clara ainda.");
    const sanitized = sanitizeP002MissingInformation(n, [
      { description: "A decisão específica ainda não está definida.", relatedField: "decision" },
      { description: "Especialidade médica não informada.", relatedField: "other" },
    ]);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]?.relatedField).toBe("decision");
  });

  it("integra sanitização na construção do DecisionCase", async () => {
    const n = narrative("O paciente disse que não realizou exames e busca um segundo parecer.");
    const decisionCase = await p002CaseBuilder.execute({
      narrative: n,
      extractedFields: {
        decisionStatement: {
          decision: "Buscar um segundo parecer.",
          goal: "Entender as opções com mais clareza.",
          sourceType: "fato_relatado",
        },
        mandatoryConstraints: [],
        preferences: [],
        missingInformation: [
          { description: "Exames realizados não foram descritos.", relatedField: "other" },
          { description: "Preço da consulta não foi mencionado.", relatedField: "other" },
        ],
      },
    });
    expect(decisionCase.missingInformation).toHaveLength(0);
  });

  it("decompõe lacuna agrupada de preferências", () => {
    const n = narrative("Prefere atendimento presencial em São Paulo.");
    const sanitized = sanitizeP002MissingInformation(n, [
      {
        description:
          "Preferências de localização, convênio, modalidade e valor não informadas.",
        relatedField: "other",
      },
    ]);
    expect(sanitized).toHaveLength(0);
  });

  it("expõe catálogo canônico de campos", () => {
    const n = narrative("Sem relato de outras doenças.");
    const catalog = classifyP002CatalogFields(n);
    expect(catalog.find((e) => e.field === "especialidade")?.state).toBe("determinado_pelo_caso");
    expect(catalog.find((e) => e.field === "preco_consulta")?.state).toBe("nao_se_aplica");
  });

  it("remove lacunas genéricas não mapeadas", () => {
    const n = narrative("História completa para decisão.");
    const result = applyP002Completeness(n, {
      decisionStatement: {
        decision: "Decidir próximo passo.",
        goal: "Mais clareza.",
        sourceType: "fato_relatado",
      },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [
        { description: "Informação complementar não especificada.", relatedField: "other" },
      ],
    });
    expect(result.missingInformation).toHaveLength(0);
  });
});

describe("Prioridade — prontidão e idempotência (regressão J)", () => {
  const baseWeights = [
    { criterion: "DISPONIBILIDADE" as const, weight: 50, evidence: "Precisa de agenda rápida.", targetValue: null },
    { criterion: "CONTINUIDADE" as const, weight: 50, evidence: "Quer acompanhamento contínuo.", targetValue: null },
  ];

  it("J: bloqueia validação quando perfil já validado", () => {
    const readiness = computePriorityValidationReadiness({
      weights: baseWeights,
      filterCriteria: [],
      validated: true,
    });
    expect(readiness.status).toBe("validado");
    expect(readiness.canValidate).toBe(false);
  });

  it("J: pronto para validar quando 100 pontos e evidências completas", () => {
    const readiness = computePriorityValidationReadiness({
      weights: baseWeights,
      filterCriteria: [],
      validated: false,
    });
    expect(readiness.status).toBe("pronto_para_validar");
    expect(readiness.canValidate).toBe(true);
    expect(readiness.blockers).toHaveLength(0);
  });

  it("bloqueia quando faltam pontos ou evidência", () => {
    const readiness = computePriorityValidationReadiness({
      weights: [{ criterion: "AREA_DE_ATUACAO", weight: 80, evidence: "ok", targetValue: null }],
      filterCriteria: [],
      validated: false,
    });
    expect(readiness.canValidate).toBe(false);
    expect(readiness.blockers.length).toBeGreaterThan(0);
  });
});
