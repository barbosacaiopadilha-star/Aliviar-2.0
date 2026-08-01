// Tentativas de aproximação e notificação interna — Incremento 2 da
// Continuidade Pós-Decisão (ADR-044 + decisão P6).
//
// Módulo puro: sem React, sem banco, sem ACE. Espelha, em TypeScript, as
// mesmas regras que os triggers impõem no banco — pelo mesmo motivo de
// `state-machine.ts`: o banco é quem garante, a aplicação é quem explica.
//
// A distinção que este módulo existe para preservar:
//
//   o fato cria trabalho; o trabalho pode gerar notificação;
//   a notificação nunca cria o fato nem a responsabilidade.

export const APPROACH_ATTEMPT_STATUSES = [
  "CRIADA",
  "DESPACHADA",
  "RESPONDIDA",
  "CANCELADA",
] as const;

export type ApproachAttemptStatus = (typeof APPROACH_ATTEMPT_STATUSES)[number];

/**
 * Desfecho da resposta — não estado da tentativa.
 *
 * "Aguardando resposta" não existe aqui porque é derivável de DESPACHADA sem
 * resposta; e "sem resposta" não existe porque é **ausência de fato**, e
 * distingui-la de indisponibilidade exigiria uma regra temporal que a operação
 * ainda não decidiu.
 */
export const APPROACH_RESPONSE_KINDS = [
  "PODE_RECEBER_CONTATO",
  "INDISPONIVEL",
] as const;

export type ApproachResponseKind = (typeof APPROACH_RESPONSE_KINDS)[number];

/** De onde veio a resposta. Relato não é o mesmo que o profissional responder. */
export const APPROACH_RESPONSE_SOURCES = [
  "PROFISSIONAL",
  "RELATO_CONCIERGE",
  "RELATO_PACIENTE",
] as const;

export type ApproachResponseSource = (typeof APPROACH_RESPONSE_SOURCES)[number];

export type ApproachAttempt = {
  id: string;
  caseId: string;
  connectionId: string;
  professionalProfileId: string;
  /** Quem executou a ação — nunca quem responde pelo Case. */
  actorId: string;
  status: ApproachAttemptStatus;
  responseKind: ApproachResponseKind | null;
  responseSource: ApproachResponseSource | null;
  createdAt: string;
  dispatchedAt: string | null;
  respondedAt: string | null;
  cancelledAt: string | null;
  receiptVerifiedAt: string | null;
};

const ALLOWED_ATTEMPT_TRANSITIONS: Record<
  ApproachAttemptStatus,
  readonly ApproachAttemptStatus[]
> = {
  CRIADA: ["DESPACHADA", "CANCELADA"],
  DESPACHADA: ["RESPONDIDA", "CANCELADA"],
  // Terminais da TENTATIVA, não da Connection: uma nova tentativa é uma linha
  // nova, e cancelar não encerra a Connection.
  RESPONDIDA: [],
  CANCELADA: [],
};

export function isValidAttemptTransition(
  from: ApproachAttemptStatus,
  to: ApproachAttemptStatus,
): boolean {
  return ALLOWED_ATTEMPT_TRANSITIONS[from].includes(to);
}

export function isTerminalAttemptStatus(status: ApproachAttemptStatus): boolean {
  return ALLOWED_ATTEMPT_TRANSITIONS[status].length === 0;
}

/** Aberta = ainda pede alguma coisa de alguém. */
export function isOpenAttempt(status: ApproachAttemptStatus): boolean {
  return status === "CRIADA" || status === "DESPACHADA";
}

export function isApproachAttemptStatus(v: unknown): v is ApproachAttemptStatus {
  return typeof v === "string" && (APPROACH_ATTEMPT_STATUSES as readonly string[]).includes(v);
}

export function isApproachResponseKind(v: unknown): v is ApproachResponseKind {
  return typeof v === "string" && (APPROACH_RESPONSE_KINDS as readonly string[]).includes(v);
}

export function isApproachResponseSource(v: unknown): v is ApproachResponseSource {
  return typeof v === "string" && (APPROACH_RESPONSE_SOURCES as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Notificação interna
// ---------------------------------------------------------------------------

export const TEAM_NOTIFICATION_KINDS = [
  "DECISAO_REGISTRADA",
  "MODO_CONTATO_DEFINIDO",
  "TENTATIVA_DESPACHADA",
  "PROFISSIONAL_DISPONIVEL",
  "PROFISSIONAL_INDISPONIVEL",
  "TENTATIVA_CANCELADA",
] as const;

export type TeamNotificationKind = (typeof TEAM_NOTIFICATION_KINDS)[number];

export type TeamNotification = {
  id: string;
  caseId: string;
  connectionId: string | null;
  approachAttemptId: string | null;
  kind: TeamNotificationKind;
  /**
   * Evidência de a quem a atenção se dirigiu à época. **Inerte**: nunca
   * concede acesso e nunca impede o novo responsável de ler (decisão P6).
   */
  recipientUserId: string | null;
  createdAt: string;
  readAt: string | null;
  readBy: string | null;
  archivedAt: string | null;
};

export function isTeamNotificationKind(v: unknown): v is TeamNotificationKind {
  return typeof v === "string" && (TEAM_NOTIFICATION_KINDS as readonly string[]).includes(v);
}

/**
 * Chave de deduplicação — derivada de **(fato, Case)**, jamais do responsável.
 * É o que garante que reatribuir o Case não produza notificação nova: a
 * reatribuição não é um fato sobre o qual a equipe precise ser avisada.
 */
export function deduplicationKey(kind: TeamNotificationKind, factId: string): string {
  return `${kind}:${factId}`;
}

/** Está na caixa: ainda não vista e não arquivada. */
export function isInInbox(notification: TeamNotification): boolean {
  return notification.readAt === null && notification.archivedAt === null;
}
