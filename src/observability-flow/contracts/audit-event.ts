export type OperationalAuditEventType =
  | "LOGIN"
  | "UPLOAD"
  | "JORNADA_ALTERADA"
  | "SESSAO_INICIO"
  | "SESSAO_FIM"
  | "OPCOES_REGISTRADAS"
  | "APROVACAO"
  | "PUBLICACAO"
  | "ESCOLHA_PACIENTE";

export type AuditActorRole = "STAFF" | "PATIENT" | "SYSTEM";

export type AuditResultado = "SUCESSO" | "FALHA";

export interface OperationalAuditEvent {
  id: string;
  correlation_id: string;
  event_type: OperationalAuditEventType;
  occurred_at: string;
  jornada_id: string | null;
  patient_id: string | null;
  curator_id: string | null;
  actor_id: string | null;
  actor_role: AuditActorRole;
  resultado: AuditResultado;
  error_code: string | null;
  duration_ms: number;
  metadata: Record<string, string | number | boolean | null>;
}

export interface RecordAuditEventInput {
  correlationId: string;
  eventType: OperationalAuditEventType;
  jornadaId?: string | null;
  patientId?: string | null;
  curatorId?: string | null;
  actorId?: string | null;
  actorRole: AuditActorRole;
  resultado: AuditResultado;
  errorCode?: string | null;
  durationMs: number;
  metadata?: Record<string, string | number | boolean | null>;
}
