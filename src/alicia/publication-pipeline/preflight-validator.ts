import { CRM_PATTERN, RQE_PATTERN } from "@/alicia/protocol-engine/constants";
import type { DoctorCandidate, PublicationDecision } from "@/alicia/protocol-engine";
import { validateCatalogImportPayload } from "@/alicia/infrastructure/import/validator";

import {
  INTERNAL_SENTINELS,
  MIN_PUBLIC_SOURCES,
  PROMOTIONAL_PATTERNS,
  RANKING_PATTERNS,
  SCOPED_SPECIALTIES,
  SCOPED_STATE,
} from "./constants";
import { assertNoPrivateData } from "./draft-builder";
import type { PreflightBlock, PreflightResult, PublicationDraft } from "./types";

function block(
  code: PreflightBlock["code"],
  message: string,
  field?: string,
): PreflightBlock {
  return { code, message, field };
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function scanTextForViolations(text: string): PreflightBlock[] {
  const blocks: PreflightBlock[] = [];

  PROMOTIONAL_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) {
      blocks.push(block("PROMOTIONAL_LANGUAGE", `Linguagem promocional detectada: ${pattern}`, "narrative"));
    }
  });

  RANKING_PATTERNS.forEach((pattern) => {
    if (pattern.test(text)) {
      blocks.push(block("RANKING_LANGUAGE", `Linguagem de ranking detectada: ${pattern}`, "narrative"));
    }
  });

  return blocks;
}

export type PreflightContext = {
  decision: PublicationDecision;
  candidate: DoctorCandidate;
  draft: PublicationDraft;
  existingDoctorIds: Set<string>;
  existingCrms: Set<string>;
  currentDoctorId?: string;
  publishedCrmByDoctorId?: Map<string, string>;
};

export function runPreflightValidation(context: PreflightContext): PreflightResult {
  const blocks: PreflightBlock[] = [];
  const { draft, decision, candidate } = context;

  if (decision.outcome !== "AUTO_PUBLISH") {
    blocks.push(block("NOT_AUTO_PUBLISH", "Decisão do Protocol Engine não é AUTO_PUBLISH."));
  }

  const crmSource = draft.payload.transparency.sources.find((source) => CRM_PATTERN.test(source.name));
  if (!crmSource && !candidate.crm.trim()) {
    blocks.push(block("CRM_MISSING", "CRM ausente no draft público.", "crm"));
  } else if (crmSource && !CRM_PATTERN.test(crmSource.name)) {
    blocks.push(block("CRM_INVALID", "CRM em formato inválido.", "crm"));
  }

  const rqeSource = draft.payload.transparency.sources.find((source) => RQE_PATTERN.test(source.name));
  if (draft.payload.specialty === "Ortopedia" && !rqeSource && !candidate.rqe?.trim()) {
    blocks.push(block("RQE_MISSING", "RQE ou TEOT ausente para ortopedia.", "rqe"));
  }

  if (!SCOPED_SPECIALTIES.has(draft.payload.specialty)) {
    blocks.push(block("SPECIALTY_OUT_OF_SCOPE", `Especialidade fora do escopo: ${draft.payload.specialty}.`));
  }

  if (candidate.hasIdentityConflict) {
    blocks.push(block("IDENTITY_CONFLICT", "Conflito de identidade registrado."));
  }

  if (!draft.payload.location.city.trim()) {
    blocks.push(block("INVALID_CITY", "Cidade inválida ou ausente.", "location.city"));
  }

  if (
    !Number.isFinite(draft.payload.location.lat) ||
    !Number.isFinite(draft.payload.location.lng) ||
    draft.payload.location.lat < -90 ||
    draft.payload.location.lat > 90
  ) {
    blocks.push(block("INVALID_COORDINATES", "Coordenadas inválidas.", "location"));
  }

  if (draft.payload.transparency.sources.length < MIN_PUBLIC_SOURCES) {
    blocks.push(
      block(
        "INSUFFICIENT_SOURCES",
        `Mínimo de ${MIN_PUBLIC_SOURCES} fontes públicas não atingido.`,
        "transparency.sources",
      ),
    );
  }

  draft.payload.transparency.sources.forEach((source, index) => {
    if (source.url && !isValidUrl(source.url)) {
      blocks.push(block("INVALID_URL", `URL inválida em fonte ${source.name}.`, `transparency.sources[${index}].url`));
    }
  });

  if (!draft.payload.name.trim() || !draft.payload.id.trim()) {
    blocks.push(block("REQUIRED_FIELD_MISSING", "Campos obrigatórios ausentes (nome ou id)."));
  }

  const serialized = JSON.stringify(draft.payload);
  if ([...INTERNAL_SENTINELS].some((sentinel) => serialized.includes(sentinel))) {
    blocks.push(block("INTERNAL_SENTINEL", "Sentinela interna detectada no payload público."));
  }

  blocks.push(
    ...scanTextForViolations(`${draft.payload.whoTheyAre} ${draft.payload.trajectory}`),
  );

  const normalizedCrm = crmSource?.name.replace(/\s+/g, " ").trim().toLowerCase();
  const isSameDoctorUpdate = context.currentDoctorId === draft.doctorId;
  if (normalizedCrm && context.existingCrms.has(normalizedCrm) && !isSameDoctorUpdate) {
    blocks.push(block("DUPLICATE_CRM", "CRM já publicado para outro perfil.", "crm"));
  }

  const slugTaken = context.existingDoctorIds.has(draft.doctorId);
  const publishedCrmForSlug = context.publishedCrmByDoctorId?.get(draft.doctorId);
  const slugConflict =
    slugTaken &&
    publishedCrmForSlug &&
    normalizedCrm &&
    publishedCrmForSlug !== normalizedCrm;
  if (slugConflict) {
    blocks.push(block("DUPLICATE_SLUG", "Slug já publicado para outro perfil (CRM diferente).", "id"));
  }

  const privateLeaks = assertNoPrivateData(draft.payload);
  privateLeaks.forEach((message) => blocks.push(block("PRIVATE_DATA_LEAK", message)));

  if (draft.payload.location.state !== SCOPED_STATE) {
    blocks.push(block("SCHEMA_INVALID", "Estado fora do escopo ES.", "location.state"));
  }

  try {
    validateCatalogImportPayload({ doctors: [draft.payload] });
  } catch (error) {
    blocks.push(
      block(
        "SCHEMA_INVALID",
        error instanceof Error ? error.message : "Payload incompatível com schema do catálogo.",
      ),
    );
  }

  return {
    status: blocks.length === 0 ? "READY_TO_PUBLISH" : "PUBLICATION_BLOCKED",
    blocks,
  };
}
