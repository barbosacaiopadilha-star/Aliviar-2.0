// Monta deterministicamente a cadeia P002→P007 e um HumanReviewResult
// (P009) fabricado, para isolar nos testes golden apenas a parte de P010
// que de fato depende do modelo de linguagem: o texto de apresentação
// (`presentation`). Tudo aqui usa as mesmas funções puras de
// src/modules/ace/artifacts/* e src/modules/ace/protocols/* que o
// Orchestrator usa em produção — nunca um shape inventado ad hoc — com
// ports in-memory (nunca Supabase) para Provider/ProviderProfile/
// ProviderPresentation, já existentes especificamente para teste.

import { createDecisionCase, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { createCaseAudit, type CaseAudit } from "@/modules/ace/artifacts/case-audit";
import { createDecisionContext, type DecisionContext } from "@/modules/ace/artifacts/decision-context";
import { p005CompetencyProfileBuilder } from "@/modules/ace/protocols/p005-competency-profile-builder";
import { p006EligibleProviderSetBuilder } from "@/modules/ace/protocols/p006-eligible-provider-set-builder";
import { p007CompatibilityMatrixBuilder } from "@/modules/ace/protocols/p007-compatibility-matrix-builder";
import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import { createHumanReviewResult, type HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import { InMemoryProviderRepository } from "@/modules/ace/ports/in-memory-provider-repository";
import { InMemoryProviderProfileRepository } from "@/modules/ace/ports/in-memory-provider-profile-repository";
import { InMemoryProviderPresentationRepository } from "@/modules/ace/ports/in-memory-provider-presentation-repository";
import type { CareProviderCandidate } from "@/modules/ace/ports/provider-repository";
import type { CareProviderProfile } from "@/modules/ace/ports/provider-profile-repository";
import type { CareProviderPresentation } from "@/modules/ace/ports/provider-presentation-repository";

const METHOD_VERSION = "ACE-0.1";
const PROVIDER_IDS = ["provider-a", "provider-b", "provider-c"];

const originEvidence = (quote: string) => ({ quote, source: "narrativa" as const });

export type P010Pipeline = {
  decisionCase: DecisionCase;
  caseAudit: CaseAudit;
  decisionContext: DecisionContext;
  compatibilityMatrix: CompatibilityMatrix;
  humanReviewResult: HumanReviewResult;
  providerPresentationRepository: InMemoryProviderPresentationRepository;
};

// Único cenário coberto por golden: Exemplo 1 de examples.md (entrega após
// APPROVE, sem ajuste humano). Os Exemplos 3/4 (REJECT, dados ausentes) são
// só validação — nunca chegam a chamar o modelo — e já são cobertos por
// teste unitário. O Exemplo 2 (ADJUST) fica para uma fixture futura, pelo
// mesmo padrão aqui (ver docs/ace/05-knowledge/golden-set-testing.md).
export async function buildApprovedPipeline(): Promise<P010Pipeline> {
  const decisionCase = createDecisionCase({
    sourceNarrativeId: "golden-narrative-p010-approve",
    decisionStatement: {
      decision: "Encontrar um profissional para uma avaliação inicial sobre ansiedade.",
      goal: "Ter clareza sobre as opções de cuidado disponíveis.",
      sourceType: "fato_relatado",
      originEvidence: originEvidence("busca uma avaliação inicial sobre a ansiedade que vem sentindo"),
    },
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: [],
  });

  const caseAudit = createCaseAudit({
    status: "READY",
    blockingIssues: [],
    warnings: [],
    missingInformation: [],
    recommendedQuestions: [],
    auditedArtifactId: decisionCase.id,
    auditedArtifactVersion: decisionCase.version,
    methodVersion: METHOD_VERSION,
  });

  const decisionContext = createDecisionContext({
    decisionType: "buscar_avaliacao",
    objective: decisionCase.decisionStatement.goal,
    clinicalDomain: "saude_emocional_mental",
    complexity: "baixa",
    urgency: "nao_determinado",
    strategy: "conexao_direta",
    mandatoryConstraints: decisionCase.mandatoryConstraints,
    assumptions: [],
    rationale: "Caso claro e completo, sem restrições ou sinais de urgência — segue direto à conexão.",
    sourceArtifacts: [
      { artifactId: decisionCase.id, artifactVersion: decisionCase.version, artifactType: "DecisionCase" },
      { artifactId: caseAudit.id, artifactVersion: caseAudit.version, artifactType: "CaseAudit" },
    ],
    methodVersion: METHOD_VERSION,
  });

  const competencyProfile = await p005CompetencyProfileBuilder.execute(decisionContext);

  const candidates: CareProviderCandidate[] = PROVIDER_IDS.map((providerId) => ({
    providerId,
    providerType: "individual",
    status: "active",
    competencyAreas: [{ domain: "saude_emocional_mental", focus: "avaliacao" }],
    experienceLevel: "experiente",
    recordVersion: 1,
    lastVerifiedAt: new Date().toISOString(),
  }));

  const eligibleProviderSet = await p006EligibleProviderSetBuilder.execute({
    competencyProfile,
    providerRepository: new InMemoryProviderRepository(candidates),
  });

  const profiles: CareProviderProfile[] = candidates.map((candidate) => ({
    ...candidate,
    intakeApproach: "ambos",
    offersContinuousCare: null,
    availabilityWindow: "flexible",
  }));

  const compatibilityMatrix = await p007CompatibilityMatrixBuilder.execute({
    decisionContext,
    competencyProfile,
    eligibleProviderSet,
    providerProfileRepository: new InMemoryProviderProfileRepository(profiles),
  });

  const approvedProviderIds = [...eligibleProviderSet.eligibleProviderIds].sort((a, b) => a.localeCompare(b));

  const humanReviewResult = createHumanReviewResult({
    reviewerId: "golden-fixture-reviewer",
    reviewedAt: new Date().toISOString(),
    reviewStatus: "VALIDATED",
    reviewAction: "APPROVE",
    originalShortlistReference: {
      artifactId: "golden-fixture-shortlist",
      artifactVersion: 1,
      artifactType: "Shortlist",
    },
    compatibilityMatrixReference: {
      artifactId: compatibilityMatrix.id,
      artifactVersion: compatibilityMatrix.version,
      artifactType: "CompatibilityMatrix",
    },
    approvedProviderIds,
    changes: [],
    reviewRationale: "Os três providers elegíveis atendem aos critérios do Método para este caso.",
    evidenceReferences: ["compatibility-matrix-strengths"],
    returnToProtocol: null,
    methodVersion: METHOD_VERSION,
  });

  const presentations: CareProviderPresentation[] = approvedProviderIds.map((providerId, index) => ({
    providerId,
    displayName: `Profissional ${String.fromCharCode(65 + index)}`,
    professionalSummary: "Psicólogo(a) com experiência em acolhimento inicial.",
    practicalConsiderations: ["Atendimento online", "Horários flexíveis"],
  }));

  return {
    decisionCase,
    caseAudit,
    decisionContext,
    compatibilityMatrix,
    humanReviewResult,
    providerPresentationRepository: new InMemoryProviderPresentationRepository(presentations),
  };
}
