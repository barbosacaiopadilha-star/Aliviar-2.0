import { PROTOCOL_VERSION } from "@/alicia/protocol-engine/constants";

export { PROTOCOL_VERSION };

export const PIPELINE_VERSION = "1.0";

export const SCOPED_SPECIALTIES = new Set(["Ortopedia", "Neurocirurgia"]);

export const SCOPED_STATE = "ES";

export const MIN_PUBLIC_SOURCES = 2;

export const INTERNAL_SENTINELS = new Set([
  "__PRIVATE__",
  "__INTERNAL__",
]);

export const PROMOTIONAL_PATTERNS = [
  /\bexcelente\b/i,
  /\brenomado\b/i,
  /\breferência\b/i,
  /\bo melhor\b/i,
  /\btop\b/i,
  /\bdestaque\b/i,
  /\bpremiado\b/i,
];

export const RANKING_PATTERNS = [
  /\branking\b/i,
  /\bscore\b/i,
  /\bnota\b/i,
  /\bconfiabilidade\s*\d/i,
  /\bnível\s*[abc]\b/i,
  /\brecomendad[oa]\b/i,
];

export const PRIVATE_FIELD_KEYS = new Set([
  "nivel",
  "operationalLevel",
  "internalNotes",
  "reviewerComments",
  "hasIdentityConflict",
  "duplicateCrm",
  "crmStatus",
  "collectedBy",
  "caseId",
  "candidateId",
  "protocolDecisionId",
  "evidenceReportId",
  "suggestedNivel",
  "failedRules",
  "pendingRules",
  "satisfiedRules",
]);

export const MATERIAL_FIELDS = [
  "name",
  "specialty",
  "location.city",
  "location.lat",
  "location.lng",
  "graduation.institution",
  "mainInstitution",
] as const;
