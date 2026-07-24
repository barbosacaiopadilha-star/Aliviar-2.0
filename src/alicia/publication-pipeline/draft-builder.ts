import { CRM_PATTERN, RQE_PATTERN, TEOT_PATTERN } from "@/alicia/protocol-engine/constants";
import { PROTOCOL_VERSION } from "@/alicia/protocol-engine/constants";
import type { DoctorCandidate, Evidence, EvidenceReport, PublicationDecision } from "@/alicia/protocol-engine";
import { slugify } from "@/alicia/infrastructure/import/slug";
import { getRadiusCenter } from "@/alicia/lib/geo";
import { canonicalizeCityName } from "@/alicia/lib/city-standardization";

import { INTERNAL_SENTINELS } from "./constants";
import type { PublicationDraft, PublicCatalogRecord } from "./types";

function sanitizeInstitution(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || INTERNAL_SENTINELS.has(trimmed)) {
    return null;
  }
  return trimmed;
}

function extractCrmLabel(candidate: DoctorCandidate, evidence: Evidence[]): string {
  if (candidate.crm.trim() && !candidate.crm.includes("presente-nas-fontes")) {
    return candidate.crm.trim();
  }

  const match = evidence.find((item) => CRM_PATTERN.test(item.name));
  return match?.name ?? "";
}

function extractRqeLabel(candidate: DoctorCandidate, evidence: Evidence[]): string {
  if (candidate.rqe?.trim() && !candidate.rqe.includes("presente-nas-fontes")) {
    return candidate.rqe.trim();
  }

  const match = evidence.find((item) => RQE_PATTERN.test(item.name));
  return match?.name ?? "";
}

function buildUnverifiedFields(
  candidate: DoctorCandidate,
  evidenceReport: EvidenceReport,
): string[] {
  const pending = new Set<string>();

  if (!candidate.graduation?.verified) {
    pending.add("Graduação");
  }

  if (!candidate.residency?.some((entry) => entry.verified)) {
    pending.add("Residência");
  }

  evidenceReport.fields
    .filter((field) => field.status === "pending" || field.status === "insufficient")
    .forEach((field) => {
      if (field.field === "graduation") pending.add("Graduação");
      if (field.field === "residency") pending.add("Residência");
      if (field.field === "fellowship") pending.add("Especializações adicionais");
      if (field.field === "practice_areas") pending.add("Áreas de atuação");
    });

  return [...pending];
}

function buildPublicSources(evidence: Evidence[]): PublicCatalogRecord["transparency"]["sources"] {
  return evidence.map((item) => ({
    name: item.name,
    type: item.type,
    ...(item.url ? { url: item.url } : {}),
  }));
}

export function buildDoctorId(candidate: DoctorCandidate): string {
  return slugify(candidate.name.replace(/^Dr\.?\s*/i, "").replace(/^Dra\.?\s*/i, ""));
}

export function buildPublicationDraft(input: {
  candidate: DoctorCandidate;
  evidence: Evidence[];
  evidenceReport: EvidenceReport;
  decision: PublicationDecision;
  protocolDecisionId: string;
  evidenceReportId: string;
  auditRefs?: string[];
  createdAt?: string;
}): PublicationDraft {
  if (input.decision.outcome !== "AUTO_PUBLISH") {
    throw new Error("PublicationDraft exige ProtocolDecision com outcome AUTO_PUBLISH.");
  }

  const doctorId = buildDoctorId(input.candidate);
  const city = canonicalizeCityName(input.candidate.city);
  const coordinates = getRadiusCenter(city);
  const lastUpdated = new Date().toISOString().slice(0, 10);
  const crmLabel = extractCrmLabel(input.candidate, input.evidence);
  const rqeLabel = extractRqeLabel(input.candidate, input.evidence);
  const mainInstitution =
    sanitizeInstitution(input.candidate.currentInstitutions?.[0]?.name ?? "") ?? "A confirmar";

  const graduationInstitution = sanitizeInstitution(
    input.candidate.graduation?.institution ?? "",
  );

  const payload: PublicCatalogRecord = {
    id: doctorId,
    name: input.candidate.name.trim(),
    specialty: input.candidate.specialty,
    location: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      city,
      state: input.candidate.state,
    },
    mainInstitution,
    whoTheyAre: `${input.candidate.specialty} com atuação em ${city}, conforme registros públicos documentados.`,
    trajectory: `Consta em registros de ${mainInstitution}. Informações de formação seguem as fontes listadas.`,
    graduation: {
      institution: graduationInstitution ?? "__PENDING_VERIFICATION__",
      program: "Medicina",
      verified: input.candidate.graduation?.verified ?? false,
      institutionCity: city,
      institutionState: input.candidate.state,
    },
    residency: (input.candidate.residency ?? [])
      .filter((entry) => entry.verified)
      .map((entry) => ({
        institution: sanitizeInstitution(entry.institution) ?? entry.institution,
        program: entry.program,
        verified: true,
        institutionCity: city,
        institutionState: input.candidate.state,
      })),
    fellowships: [],
    practiceAreas: [...new Set(input.candidate.practiceAreas ?? [input.candidate.specialty])],
    institutions: (input.candidate.currentInstitutions ?? []).map((institution) => ({
      name: institution.name,
      role: institution.role,
      city,
      state: input.candidate.state,
    })),
    scientificProductionPlaceholder: "Publicações ainda não listadas neste perfil.",
    transparency: {
      lastUpdated,
      sources: buildPublicSources(input.evidence),
      unverifiedFields: buildUnverifiedFields(input.candidate, input.evidenceReport),
    },
  };

  if (crmLabel) {
    const hasCrm = payload.transparency.sources.some((source) => CRM_PATTERN.test(source.name));
    if (!hasCrm) {
      payload.transparency.sources.unshift({
        name: crmLabel,
        type: "Registro profissional",
      });
    }
  }

  if (rqeLabel || input.candidate.teot) {
    const specialistSource = rqeLabel || input.candidate.teot!;
    const hasRqe = payload.transparency.sources.some(
      (source) => RQE_PATTERN.test(source.name) || TEOT_PATTERN.test(source.name),
    );
    if (!hasRqe) {
      payload.transparency.sources.push({
        name: specialistSource,
        type: TEOT_PATTERN.test(specialistSource)
          ? "Título de especialista"
          : "Registro de qualificação de especialista",
      });
    }
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `draft-${doctorId}-${createdAt}`,
    candidateId: input.candidate.id,
    caseId: input.candidate.caseId,
    doctorId,
    protocolVersion: PROTOCOL_VERSION,
    protocolDecisionId: input.protocolDecisionId,
    evidenceReportId: input.evidenceReportId,
    auditRefs: input.auditRefs ?? [],
    lastVerifiedAt: createdAt,
    payload,
    createdAt,
  };
}

export function assertNoPrivateData(payload: PublicCatalogRecord): string[] {
  const json = JSON.stringify(payload);
  const leaks: string[] = [];

  if (json.includes("__PRIVATE__") || json.includes("internalNotes")) {
    leaks.push("Dados privados detectados no payload.");
  }

  return leaks;
}
