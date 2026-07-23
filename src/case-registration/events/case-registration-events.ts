export type CaseRegistrationEventType =
  | "CASE_CREATED"
  | "PATIENT_ASSOCIATED"
  | "JOURNEY_BOOTSTRAPPED"
  | "OWNERSHIP_ASSIGNED";

export interface CaseRegistrationEvent {
  id: string;
  caseId: string;
  journeyId: string | null;
  type: CaseRegistrationEventType;
  actorId: string;
  occurredAt: string;
  metadata?: Record<string, string>;
}

export const CASE_TIMELINE_TITLES: Record<CaseRegistrationEventType, string> = {
  CASE_CREATED: "Caso registrado",
  PATIENT_ASSOCIATED: "Paciente associado ao caso",
  JOURNEY_BOOTSTRAPPED: "Jornada iniciada a partir do caso",
  OWNERSHIP_ASSIGNED: "Respons├ível atribu├¡do ├á jornada",
};
