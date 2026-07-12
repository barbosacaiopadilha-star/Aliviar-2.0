import type { CaseStatus } from "./types";

// Espelha exatamente a máquina de estados reforçada no banco
// (enforce_case_status_transition_trigger, migration 20260712100000) —
// mantida aqui para validação antecipada na aplicação (evita uma
// ida desnecessária ao banco só para descobrir que a transição é
// inválida), nunca como a única fonte de verdade (ADR-019).
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["WAITING_FOR_INFORMATION", "READY_FOR_CURATION", "CANCELLED"],
  WAITING_FOR_INFORMATION: ["IN_REVIEW", "CANCELLED"],
  READY_FOR_CURATION: ["IN_CURATION", "CANCELLED"],
  // WAITING_FOR_INFORMATION acrescentado na Sprint 3: um CaseAudit (P003)
  // BLOCKED durante a execução do ACE significa que faltam informações
  // básicas do paciente — a curadoria não pode nem começar de fato.
  IN_CURATION: ["HUMAN_REVIEW", "WAITING_FOR_INFORMATION", "CANCELLED"],
  HUMAN_REVIEW: ["DELIVERED", "WAITING_FOR_INFORMATION", "CANCELLED"],
  DELIVERED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function isValidCaseTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedNextStatuses(from: CaseStatus): CaseStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
