import type { EvidenceField } from "./types";

export const PROTOCOL_VERSION = "1.0";

export const SCOPED_STATE = "ES";

export const SCOPED_SPECIALTIES = new Set(["Ortopedia", "Neurocirurgia"]);

export const MIN_SOURCES_FOR_PUBLICATION = 2;

export const MIN_HIGH_TRUST_SOURCES = 1;

export const HIGH_TRUST_MAX_LEVEL = 3 as const;

export const PENDING_INSTITUTION_MARKERS = new Set([
  "__PENDING_VERIFICATION__",
  "Ainda não confirmado",
]);

export const CRM_PATTERN = /\bCRM[-\s]?[A-Z]{2}\s*\d[\d.]{2,}\b/i;
export const RQE_PATTERN = /\bRQE\s*\d[\d.]{2,}\b/i;
export const TEOT_PATTERN = /\bTEOT\s*\d[\d.]{2,}\b/i;

export const FIELD_SUPPORTS_MAP: Record<string, EvidenceField[]> = {
  "Registro profissional": ["identity", "crm", "crm_status", "specialty", "city"],
  "Registro de qualificação de especialista": ["rqe", "specialty"],
  "Título de especialista": ["teot", "specialty", "trajectory_milestone"],
  Instituição: ["current_practice", "specialty", "city", "trajectory_milestone"],
  "Sociedade médica": ["rqe", "teot", "specialty", "trajectory_milestone"],
  "Registro público": ["current_practice", "city"],
  "Publicação científica": ["graduation", "residency", "trajectory_milestone"],
  Diretório: ["specialty", "current_practice"],
};
