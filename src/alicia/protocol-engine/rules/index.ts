import {
  CRM_PATTERN,
  MIN_HIGH_TRUST_SOURCES,
  MIN_SOURCES_FOR_PUBLICATION,
  PENDING_INSTITUTION_MARKERS,
  RQE_PATTERN,
  SCOPED_SPECIALTIES,
  SCOPED_STATE,
  TEOT_PATTERN,
} from "../constants";
import type { DoctorCandidate, Evidence, EvidenceReport, RuleResult } from "../types";

export type RuleContext = {
  candidate: DoctorCandidate;
  evidence: Evidence[];
  evidenceReport: EvidenceReport;
};

export type ProtocolRule = {
  id: string;
  name: string;
  protocolRef: string;
  category: "eligibility" | "formation" | "publication";
  evaluate: (context: RuleContext) => RuleResult;
};

function ruleResult(
  rule: Pick<ProtocolRule, "id" | "name" | "protocolRef">,
  status: RuleResult["status"],
  message: string,
): RuleResult {
  return { ...rule, status, message };
}

function hasCrmEvidence(evidence: Evidence[]): boolean {
  return evidence.some(
    (item) => item.supportsFields.includes("crm") || CRM_PATTERN.test(item.name),
  );
}

function hasRqeOrTeotEvidence(candidate: DoctorCandidate, evidence: Evidence[]): boolean {
  if (candidate.rqe?.trim() || candidate.teot?.trim()) {
    return true;
  }

  return evidence.some(
    (item) =>
      item.supportsFields.includes("rqe") ||
      item.supportsFields.includes("teot") ||
      RQE_PATTERN.test(item.name) ||
      TEOT_PATTERN.test(item.name),
  );
}

function isPendingInstitution(value?: string): boolean {
  if (!value) {
    return true;
  }

  return PENDING_INSTITUTION_MARKERS.has(value) || value.trim().length === 0;
}

export const ELIGIBILITY_RULES: ProtocolRule[] = [
  {
    id: "ELIG-001",
    name: "Nome completo coletado",
    protocolRef: "Cap. 12 — A1",
    category: "eligibility",
    evaluate: ({ candidate }) =>
      ruleResult(
        { id: "ELIG-001", name: "Nome completo coletado", protocolRef: "Cap. 12 — A1" },
        candidate.name.trim().length >= 3 ? "satisfied" : "failed",
        candidate.name.trim().length >= 3
          ? "Nome completo presente no dossiê."
          : "Nome completo ausente ou insuficiente.",
      ),
  },
  {
    id: "ELIG-002",
    name: "CRM documentado",
    protocolRef: "Cap. 3 — 3.1",
    category: "eligibility",
    evaluate: ({ candidate, evidence }) => {
      const satisfied = candidate.crm.trim().length > 0 || hasCrmEvidence(evidence);
      return ruleResult(
        { id: "ELIG-002", name: "CRM documentado", protocolRef: "Cap. 3 — 3.1" },
        satisfied ? "satisfied" : "pending",
        satisfied ? "CRM presente no dossiê ou nas fontes." : "CRM ausente — requer revisão humana.",
      );
    },
  },
  {
    id: "ELIG-003",
    name: "CRM ativo",
    protocolRef: "Cap. 3 — 3.1",
    category: "eligibility",
    evaluate: ({ candidate }) => {
      if (candidate.crmStatus === "active") {
        return ruleResult(
          { id: "ELIG-003", name: "CRM ativo", protocolRef: "Cap. 3 — 3.1" },
          "satisfied",
          "CRM com situação ativa.",
        );
      }

      if (candidate.crmStatus === "unknown") {
        return ruleResult(
          { id: "ELIG-003", name: "CRM ativo", protocolRef: "Cap. 3 — 3.1" },
          "pending",
          "Situação do CRM não confirmada.",
        );
      }

      return ruleResult(
        { id: "ELIG-003", name: "CRM ativo", protocolRef: "Cap. 3 — 3.1" },
        "failed",
        `CRM em situação irregular: ${candidate.crmStatus}.`,
      );
    },
  },
  {
    id: "ELIG-004",
    name: "Especialidade no escopo",
    protocolRef: "Cap. 2 — Escopo",
    category: "eligibility",
    evaluate: ({ candidate }) =>
      ruleResult(
        { id: "ELIG-004", name: "Especialidade no escopo", protocolRef: "Cap. 2 — Escopo" },
        SCOPED_SPECIALTIES.has(candidate.specialty) ? "satisfied" : "failed",
        SCOPED_SPECIALTIES.has(candidate.specialty)
          ? `Especialidade "${candidate.specialty}" dentro do escopo piloto.`
          : `Especialidade "${candidate.specialty}" fora do escopo (Ortopedia/Neurocirurgia).`,
      ),
  },
  {
    id: "ELIG-005",
    name: "Atuação no Espírito Santo",
    protocolRef: "Cap. 3 — 3.3",
    category: "eligibility",
    evaluate: ({ candidate }) =>
      ruleResult(
        { id: "ELIG-005", name: "Atuação no Espírito Santo", protocolRef: "Cap. 3 — 3.3" },
        candidate.state.trim().toUpperCase() === SCOPED_STATE && candidate.city.trim().length > 0
          ? "satisfied"
          : "failed",
        candidate.state.trim().toUpperCase() === SCOPED_STATE
          ? `Cidade principal ${candidate.city}/${candidate.state} confirmada.`
          : "Atuação principal fora do Espírito Santo.",
      ),
  },
  {
    id: "ELIG-006",
    name: "RQE ou TEOT (ortopedia obrigatório)",
    protocolRef: "Cap. 3 — 3.2",
    category: "eligibility",
    evaluate: ({ candidate, evidence }) => {
      const hasTitle = hasRqeOrTeotEvidence(candidate, evidence);

      if (candidate.specialty !== "Ortopedia") {
        return ruleResult(
          { id: "ELIG-006", name: "RQE ou TEOT (ortopedia obrigatório)", protocolRef: "Cap. 3 — 3.2" },
          "satisfied",
          "Regra aplicável somente a ortopedia.",
        );
      }

      return ruleResult(
        { id: "ELIG-006", name: "RQE ou TEOT (ortopedia obrigatório)", protocolRef: "Cap. 3 — 3.2" },
        hasTitle ? "satisfied" : "failed",
        hasTitle
          ? "RQE ou TEOT documentado para ortopedia."
          : "Ortopedia exige RQE ou TEOT documentado.",
      );
    },
  },
  {
    id: "ELIG-007",
    name: "RQE ou título (neurocirurgia)",
    protocolRef: "Cap. 3 — 3.2",
    category: "eligibility",
    evaluate: ({ candidate, evidence }) => {
      if (candidate.specialty !== "Neurocirurgia") {
        return ruleResult(
          { id: "ELIG-007", name: "RQE ou título (neurocirurgia)", protocolRef: "Cap. 3 — 3.2" },
          "satisfied",
          "Regra aplicável somente a neurocirurgia.",
        );
      }

      const hasTitle = hasRqeOrTeotEvidence(candidate, evidence);
      return ruleResult(
        { id: "ELIG-007", name: "RQE ou título (neurocirurgia)", protocolRef: "Cap. 3 — 3.2" },
        hasTitle ? "satisfied" : "pending",
        hasTitle
          ? "RQE ou título documentado para neurocirurgia."
          : "Neurocirurgia sem RQE/título documentado — processamento permitido, publicação plena pendente.",
      );
    },
  },
  {
    id: "ELIG-008",
    name: "Fonte nível 1–3 documentada",
    protocolRef: "Cap. 12 — A7",
    category: "eligibility",
    evaluate: ({ evidenceReport }) =>
      ruleResult(
        { id: "ELIG-008", name: "Fonte nível 1–3 documentada", protocolRef: "Cap. 12 — A7" },
        evidenceReport.level1to3Count >= MIN_HIGH_TRUST_SOURCES ? "satisfied" : "failed",
        evidenceReport.level1to3Count >= MIN_HIGH_TRUST_SOURCES
          ? `${evidenceReport.level1to3Count} fonte(s) nível 1–3 presente(s).`
          : "Nenhuma fonte nível 1–3 documentada.",
      ),
  },
  {
    id: "ELIG-009",
    name: "Documentação mínima do dossiê",
    protocolRef: "Cap. 3 — 3.4",
    category: "eligibility",
    evaluate: ({ candidate, evidence }) => {
      const hasCollector = candidate.collectedBy.trim().length > 0 && candidate.collectedAt.trim().length > 0;
      const hasCrm = candidate.crm.trim().length > 0 || hasCrmEvidence(evidence);
      const hasMinimum =
        candidate.name.trim().length > 0 &&
        hasCrm &&
        SCOPED_SPECIALTIES.has(candidate.specialty) &&
        candidate.city.trim().length > 0 &&
        evidence.length > 0 &&
        hasCollector;

      if (!hasCrm && hasCollector && candidate.name.trim().length > 0) {
        return ruleResult(
          { id: "ELIG-009", name: "Documentação mínima do dossiê", protocolRef: "Cap. 3 — 3.4" },
          "pending",
          "CRM ausente — dossiê aguarda consulta ao conselho.",
        );
      }

      return ruleResult(
        { id: "ELIG-009", name: "Documentação mínima do dossiê", protocolRef: "Cap. 3 — 3.4" },
        hasMinimum ? "satisfied" : "failed",
        hasMinimum
          ? "Documentação mínima presente."
          : "Dossiê incompleto para entrada no pipeline.",
      );
    },
  },
  {
    id: "ELIG-010",
    name: "Trajetória verificável",
    protocolRef: "Cap. 3 — 3.5",
    category: "eligibility",
    evaluate: ({ candidate, evidenceReport }) => {
      const milestoneField = evidenceReport.fields.find((f) => f.field === "trajectory_milestone");
      const hasInstitution = (candidate.currentInstitutions?.length ?? 0) > 0;
      const hasVerifiedGraduation = candidate.graduation?.verified === true;
      const hasVerifiedResidency = candidate.residency?.some((entry) => entry.verified) ?? false;
      const hasMilestone =
        milestoneField?.status === "confirmed" ||
        hasInstitution ||
        hasVerifiedGraduation ||
        hasVerifiedResidency;

      return ruleResult(
        { id: "ELIG-010", name: "Trajetória verificável", protocolRef: "Cap. 3 — 3.5" },
        hasMilestone ? "satisfied" : "pending",
        hasMilestone
          ? "Pelo menos um marco de formação ou atuação verificável."
          : "Nenhum marco de formação ou atuação confirmado.",
      );
    },
  },
  {
    id: "ELIG-011",
    name: "Fontes utilizáveis para publicação",
    protocolRef: "Cap. 7 — 7.3",
    category: "eligibility",
    evaluate: ({ evidenceReport }) =>
      ruleResult(
        { id: "ELIG-011", name: "Fontes utilizáveis para publicação", protocolRef: "Cap. 7 — 7.3" },
        evidenceReport.onlyLowTrustSources ? "failed" : "satisfied",
        evidenceReport.onlyLowTrustSources
          ? "Apenas fontes nível 6–7 — não publicável."
          : "Há fontes utilizáveis além de diretórios/redes sociais.",
      ),
  },
  {
    id: "ELIG-012",
    name: "Sem conflito de identidade",
    protocolRef: "Cap. 7 — 7.3",
    category: "eligibility",
    evaluate: ({ candidate }) =>
      ruleResult(
        { id: "ELIG-012", name: "Sem conflito de identidade", protocolRef: "Cap. 7 — 7.3" },
        candidate.hasIdentityConflict ? "pending" : "satisfied",
        candidate.hasIdentityConflict
          ? "Possível homônimo ou conflito de identidade — revisão humana."
          : "Sem conflito de identidade registrado.",
      ),
  },
  {
    id: "ELIG-013",
    name: "Sem duplicidade de CRM",
    protocolRef: "Cap. 8 — 8.1",
    category: "eligibility",
    evaluate: ({ candidate }) =>
      ruleResult(
        { id: "ELIG-013", name: "Sem duplicidade de CRM", protocolRef: "Cap. 8 — 8.1" },
        candidate.duplicateCrm ? "failed" : "satisfied",
        candidate.duplicateCrm
          ? "CRM duplicado em outro perfil."
          : "Sem duplicidade de CRM.",
      ),
  },
];

export const FORMATION_RULES: ProtocolRule[] = [
  {
    id: "FORM-001",
    name: "Graduação confirmada (Nível A)",
    protocolRef: "Cap. 7 — 7.1",
    category: "formation",
    evaluate: ({ candidate, evidenceReport }) => {
      const field = evidenceReport.fields.find((f) => f.field === "graduation");
      const verified = candidate.graduation?.verified === true && !isPendingInstitution(candidate.graduation?.institution);
      const status = field?.status === "confirmed" || verified ? "satisfied" : field?.status === "conflicting" ? "pending" : "pending";

      return ruleResult(
        { id: "FORM-001", name: "Graduação confirmada (Nível A)", protocolRef: "Cap. 7 — 7.1" },
        status,
        status === "satisfied"
          ? "Graduação confirmada por fonte nível 1–3."
          : field?.status === "conflicting"
            ? "Conflito entre fontes de graduação."
            : "Graduação não confirmada.",
      );
    },
  },
  {
    id: "FORM-002",
    name: "Residência confirmada (Nível A)",
    protocolRef: "Cap. 7 — 7.1",
    category: "formation",
    evaluate: ({ candidate, evidenceReport }) => {
      const field = evidenceReport.fields.find((f) => f.field === "residency");
      const verified = candidate.residency?.some((entry) => entry.verified) ?? false;
      const status = field?.status === "confirmed" || verified ? "satisfied" : field?.status === "conflicting" ? "pending" : "pending";

      return ruleResult(
        { id: "FORM-002", name: "Residência confirmada (Nível A)", protocolRef: "Cap. 7 — 7.1" },
        status,
        status === "satisfied"
          ? "Residência confirmada por fonte nível 1–3."
          : field?.status === "conflicting"
            ? "Conflito entre fontes de residência."
            : "Residência não confirmada.",
      );
    },
  },
  {
    id: "FORM-003",
    name: "Atuação atual confirmada",
    protocolRef: "Cap. 7 — 7.1",
    category: "formation",
    evaluate: ({ candidate, evidenceReport }) => {
      const field = evidenceReport.fields.find((f) => f.field === "current_practice");
      const hasInstitution = (candidate.currentInstitutions?.length ?? 0) > 0;
      const status = field?.status === "confirmed" || hasInstitution ? "satisfied" : "pending";

      return ruleResult(
        { id: "FORM-003", name: "Atuação atual confirmada", protocolRef: "Cap. 7 — 7.1" },
        status,
        status === "satisfied"
          ? "Atuação institucional ou consultório confirmada."
          : "Atuação atual sem confirmação suficiente.",
      );
    },
  },
  {
    id: "FORM-004",
    name: "Especialidade confirmada",
    protocolRef: "Cap. 7 — 7.1",
    category: "formation",
    evaluate: ({ evidenceReport }) => {
      const field = evidenceReport.fields.find((f) => f.field === "specialty");
      const status = field?.status === "confirmed" ? "satisfied" : field?.status === "conflicting" ? "pending" : "pending";

      return ruleResult(
        { id: "FORM-004", name: "Especialidade confirmada", protocolRef: "Cap. 7 — 7.1" },
        status,
        status === "satisfied"
          ? "Especialidade confirmada por fonte nível 1–3."
          : field?.status === "conflicting"
            ? "Conflito entre fontes de especialidade."
            : "Especialidade sem confirmação suficiente.",
      );
    },
  },
];

export const PUBLICATION_RULES: ProtocolRule[] = [
  {
    id: "PUB-001",
    name: "Mínimo de 2 fontes no perfil",
    protocolRef: "Cap. 12 — D4",
    category: "publication",
    evaluate: ({ evidence }) =>
      ruleResult(
        { id: "PUB-001", name: "Mínimo de 2 fontes no perfil", protocolRef: "Cap. 12 — D4" },
        evidence.length >= MIN_SOURCES_FOR_PUBLICATION ? "satisfied" : "pending",
        evidence.length >= MIN_SOURCES_FOR_PUBLICATION
          ? `${evidence.length} fontes documentadas.`
          : `Apenas ${evidence.length} fonte(s) — mínimo ${MIN_SOURCES_FOR_PUBLICATION}.`,
      ),
  },
  {
    id: "PUB-002",
    name: "Sem conflitos críticos não resolvidos",
    protocolRef: "Cap. 6 — 6.3",
    category: "publication",
    evaluate: ({ evidenceReport }) => {
      const criticalConflicts = evidenceReport.conflicts.filter((conflict) =>
        ["crm", "identity", "specialty", "rqe"].includes(conflict.field),
      );

      return ruleResult(
        { id: "PUB-002", name: "Sem conflitos críticos não resolvidos", protocolRef: "Cap. 6 — 6.3" },
        criticalConflicts.length === 0 ? "satisfied" : "pending",
        criticalConflicts.length === 0
          ? "Sem conflitos críticos entre fontes."
          : `${criticalConflicts.length} conflito(s) crítico(s) pendente(s).`,
      );
    },
  },
  {
    id: "PUB-003",
    name: "Nível A exige quatro olhos",
    protocolRef: "Cap. 12 — F3",
    category: "publication",
    evaluate: ({ candidate, evidenceReport }) => {
      const form001 = FORMATION_RULES[0]!.evaluate({ candidate, evidence: [], evidenceReport });
      const form002 = FORMATION_RULES[1]!.evaluate({ candidate, evidence: [], evidenceReport });
      const form003 = FORMATION_RULES[2]!.evaluate({ candidate, evidence: [], evidenceReport });
      const form004 = FORMATION_RULES[3]!.evaluate({ candidate, evidence: [], evidenceReport });

      const wouldBeNivelA =
        form001.status === "satisfied" &&
        form002.status === "satisfied" &&
        form003.status === "satisfied" &&
        form004.status === "satisfied";

      return ruleResult(
        { id: "PUB-003", name: "Nível A exige quatro olhos", protocolRef: "Cap. 12 — F3" },
        wouldBeNivelA ? "pending" : "satisfied",
        wouldBeNivelA
          ? "Critérios de Nível A atendidos — exige segundo revisor/curador sênior."
          : "Publicação não requer quatro olhos para Nível A.",
      );
    },
  },
];

export const ALL_PROTOCOL_RULES: ProtocolRule[] = [
  ...ELIGIBILITY_RULES,
  ...FORMATION_RULES,
  ...PUBLICATION_RULES,
];

export function executeRules(
  rules: ProtocolRule[],
  context: RuleContext,
): RuleResult[] {
  return rules.map((protocolRule) => protocolRule.evaluate(context));
}

export function partitionRuleResults(results: RuleResult[]): {
  satisfied: RuleResult[];
  failed: RuleResult[];
  pending: RuleResult[];
} {
  return {
    satisfied: results.filter((r) => r.status === "satisfied"),
    failed: results.filter((r) => r.status === "failed"),
    pending: results.filter((r) => r.status === "pending"),
  };
}
