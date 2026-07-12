import { describe, expect, it } from "vitest";

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { createDecisionCase } from "@/modules/ace/artifacts/decision-case";
import { createDecisionContext } from "@/modules/ace/artifacts/decision-context";
import { createHumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import type { P010Presentation } from "@/modules/ace/protocols/p010-final-curadoria-delivery";

describe("FakeAceLanguageModel — determinístico, sem fornecedor real", () => {
  it("P002: extrai decisionStatement a partir do texto real da narrativa, nunca inventa restrições/preferências", async () => {
    const model = new FakeAceLanguageModel();
    const narrative = createNarrative({
      text: "Estou buscando apoio para ansiedade.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const response = await model.run({
      protocolId: "P002",
      protocolVersion: "ACE-0.1",
      prompt: "p002",
      input: { narrative },
    });

    expect(response.metadata.status).toBe("ok");
    expect(response.metadata.modelId).toBe("fake-deterministic-v1");
    const output = response.output as {
      decisionStatement: { decision: string | null; goal: string | null };
      mandatoryConstraints: unknown[];
      preferences: unknown[];
    };
    expect(output.decisionStatement.decision).toBe(narrative.text);
    expect(output.decisionStatement.goal).toBe(narrative.text);
    expect(output.mandatoryConstraints).toEqual([]);
    expect(output.preferences).toEqual([]);
  });

  it("P002: registra missingInformation quando a narrativa está vazia, nunca inventa conteúdo", async () => {
    const model = new FakeAceLanguageModel();
    const narrative = createNarrative({
      text: "",
      closingQuestionsAnswered: { historia: false, decisao: false, objetivo: false },
    });

    const response = await model.run({
      protocolId: "P002",
      protocolVersion: "ACE-0.1",
      prompt: "p002",
      input: { narrative },
    });

    const output = response.output as {
      decisionStatement: { decision: string | null; goal: string | null };
      missingInformation: unknown[];
    };
    expect(output.decisionStatement.decision).toBeNull();
    expect(output.missingInformation.length).toBeGreaterThan(0);
  });

  it("P003: nunca produz achados adicionais (sem análise semântica real)", async () => {
    const model = new FakeAceLanguageModel();
    const decisionCase = createDecisionCase({
      sourceNarrativeId: "narrative-1",
      decisionStatement: { decision: "x", goal: "y", sourceType: "fato_relatado" },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [],
    });

    const response = await model.run({
      protocolId: "P003",
      protocolVersion: "ACE-0.1",
      prompt: "p003",
      input: { decisionCase },
    });

    expect((response.output as { additionalFindings: unknown[] }).additionalFindings).toEqual([]);
  });

  it("P004: objective sempre igual ao goal do DecisionCase (nunca inventado); domínio/urgência sempre conservadores", async () => {
    const model = new FakeAceLanguageModel();
    const decisionCase = createDecisionCase({
      sourceNarrativeId: "narrative-1",
      decisionStatement: { decision: "x", goal: "meu objetivo real", sourceType: "fato_relatado" },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [],
    });

    const response = await model.run({
      protocolId: "P004",
      protocolVersion: "ACE-0.1",
      prompt: "p004",
      input: { decisionCase },
    });

    const output = response.output as { objective: string | null; clinicalDomain: string; urgency: string };
    expect(output.objective).toBe("meu objetivo real");
    expect(output.clinicalDomain).toBe("nao_determinado");
    expect(output.urgency).toBe("nao_determinado");
  });

  it("retorna erro estruturado para um protocolo que não implementa (nunca lança exceção)", async () => {
    const model = new FakeAceLanguageModel();
    const response = await model.run({
      protocolId: "P005",
      protocolVersion: "ACE-0.1",
      prompt: "p005",
      input: {},
    });

    expect(response.metadata.status).toBe("error");
    expect(response.metadata.error?.code).toBe("UNSUPPORTED_PROTOCOL");
    expect(response.output).toBeNull();
  });

  it("nunca depende de rede/fornecedor externo — duas chamadas com a mesma entrada produzem a mesma saída", async () => {
    const model = new FakeAceLanguageModel();
    const narrative = createNarrative({
      text: "Texto estável para teste de determinismo.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const first = await model.run({ protocolId: "P002", protocolVersion: "ACE-0.1", prompt: "p002", input: { narrative } });
    const second = await model.run({ protocolId: "P002", protocolVersion: "ACE-0.1", prompt: "p002", input: { narrative } });

    expect(first.output).toEqual(second.output);
  });

  it("P010: decisionSummary cita o objetivo do paciente literalmente, nunca inventa; texto nunca menciona protocolo/artefato/modelo", async () => {
    const model = new FakeAceLanguageModel();
    const decisionCase = createDecisionCase({
      sourceNarrativeId: "narrative-1",
      decisionStatement: { decision: "x", goal: "encontrar apoio para ansiedade", sourceType: "fato_relatado" },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [],
    });
    const decisionContext = createDecisionContext({
      decisionType: "buscar_avaliacao",
      objective: decisionCase.decisionStatement.goal,
      clinicalDomain: "nao_determinado",
      complexity: "media",
      urgency: "nao_determinado",
      strategy: "avaliacao_inicial",
      mandatoryConstraints: [],
      assumptions: [],
      rationale: "Classificação conservadora.",
      sourceArtifacts: [{ artifactId: decisionCase.id, artifactVersion: decisionCase.version, artifactType: "DecisionCase" }],
      methodVersion: "ACE-0.1",
    });
    const humanReviewResult = createHumanReviewResult({
      reviewerId: "reviewer-1",
      reviewedAt: new Date().toISOString(),
      reviewStatus: "VALIDATED",
      reviewAction: "ADJUST",
      originalShortlistReference: { artifactId: "shortlist-1", artifactVersion: 1, artifactType: "Shortlist" },
      compatibilityMatrixReference: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
      approvedProviderIds: ["provider-a", "provider-b", "provider-c"],
      changes: [
        { type: "added", providerId: "provider-c", rationale: "Disponibilidade compatível confirmada.", evidenceReferences: ["contato"] },
      ],
      reviewRationale: "Composição adequada às necessidades relatadas.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      returnToProtocol: null,
      methodVersion: "ACE-0.1",
    });

    const response = await model.run<
      { decisionCase: typeof decisionCase; decisionContext: typeof decisionContext; humanReviewResult: typeof humanReviewResult },
      P010Presentation
    >({
      protocolId: "P010",
      protocolVersion: "ACE-0.1",
      prompt: "p010",
      input: { decisionCase, decisionContext, humanReviewResult },
    });

    expect(response.metadata.status).toBe("ok");
    const output = response.output!;
    expect(output.decisionSummary).toContain("encontrar apoio para ansiedade");

    const allText = [
      output.decisionSummary,
      output.clientContextSummary,
      output.comparisonSummary,
      output.methodExplanation,
      output.disclaimer,
      ...output.nextSteps,
    ]
      .join(" ")
      .toLowerCase();
    for (const forbidden of ["p001", "p002", "p010", "protocolo", "artefato", "fake-deterministic", "prompt"]) {
      expect(allText).not.toContain(forbidden);
    }

    // Provider explicitamente adicionado via ADJUST: usa a justificativa da
    // própria alteração; os demais (parte da composição original) usam a
    // justificativa geral do revisor — nunca inventadas.
    const narrativeByProviderId = new Map(output.providerNarratives.map((n) => [n.providerId, n.whyIncluded]));
    expect(narrativeByProviderId.get("provider-c")).toBe("Disponibilidade compatível confirmada.");
    expect(narrativeByProviderId.get("provider-a")).toBe("Composição adequada às necessidades relatadas.");
  });

  it("retorna erro estruturado para um protocolId totalmente desconhecido", async () => {
    const model = new FakeAceLanguageModel();
    const response = await model.run({ protocolId: "P099" as never, protocolVersion: "ACE-0.1", prompt: "x", input: {} });
    expect(response.metadata.status).toBe("error");
  });
});
