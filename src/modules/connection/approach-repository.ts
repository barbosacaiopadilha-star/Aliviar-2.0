import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import {
  isApproachAttemptStatus,
  isApproachResponseKind,
  isApproachResponseSource,
  isTeamNotificationKind,
  type ApproachAttempt,
  type ApproachResponseKind,
  type ApproachResponseSource,
  type TeamNotification,
} from "./approach";
import { ConnectionError } from "./errors";

/**
 * Persistência das tentativas e das notificações internas.
 *
 * Toda escrita passa pelas RPCs transacionais — tentativa e evento (e, quando
 * cabe, notificação) nascem juntos ou não nascem. A autorização é sempre da
 * RLS: as funções são `security invoker`, e este repositório nunca decide quem
 * pode o quê.
 */

const ATTEMPT_COLUMNS =
  "id, case_id, connection_id, professional_profile_id, actor_id, status, response_kind, response_source, created_at, dispatched_at, responded_at, cancelled_at, receipt_verified_at";

const NOTIFICATION_COLUMNS =
  "id, case_id, connection_id, approach_attempt_id, kind, recipient_user_id, created_at, read_at, read_by, archived_at";

type AttemptRow = Record<string, unknown>;

function mapAttempt(row: AttemptRow): ApproachAttempt {
  const status = row.status;
  if (!isApproachAttemptStatus(status)) {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: `Estado de tentativa desconhecido persistido no banco: "${String(status)}".`,
    });
  }
  return {
    id: row.id as string,
    caseId: row.case_id as string,
    connectionId: row.connection_id as string,
    professionalProfileId: row.professional_profile_id as string,
    actorId: row.actor_id as string,
    status,
    responseKind: isApproachResponseKind(row.response_kind) ? row.response_kind : null,
    responseSource: isApproachResponseSource(row.response_source) ? row.response_source : null,
    createdAt: row.created_at as string,
    dispatchedAt: (row.dispatched_at as string | null) ?? null,
    respondedAt: (row.responded_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    receiptVerifiedAt: (row.receipt_verified_at as string | null) ?? null,
  };
}

function mapNotification(row: AttemptRow): TeamNotification | null {
  const kind = row.kind;
  if (!isTeamNotificationKind(kind)) return null;
  return {
    id: row.id as string,
    caseId: row.case_id as string,
    connectionId: (row.connection_id as string | null) ?? null,
    approachAttemptId: (row.approach_attempt_id as string | null) ?? null,
    kind,
    recipientUserId: (row.recipient_user_id as string | null) ?? null,
    createdAt: row.created_at as string,
    readAt: (row.read_at as string | null) ?? null,
    readBy: (row.read_by as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
  };
}

function translate(error: { code?: string; message: string }): never {
  // 55000 = pré-condição de estado recusada pela própria RPC.
  if (error.code === "55000") {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: "Esta ação não é válida para o estado atual da tentativa.",
    });
  }
  // 23514 = guarda de coerência (modo, vínculo, Connection).
  if (error.code === "23514") {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: "Esta tentativa não é permitida para esta Connection.",
    });
  }
  if (error.code === "23505") {
    throw new ConnectionError({
      code: "CONCURRENT_CONFLICT",
      message: "Já existe uma tentativa aberta para esta escolha.",
    });
  }
  // Erro não mapeado: a mensagem do banco fica no lado do servidor, para
  // observabilidade. A camada de action é quem traduz para o operador — nada
  // disto chega à paciente.
  throw new Error(
    `Não foi possível registrar esta ação da continuidade. [${error.code ?? "sem código"}] ${error.message}`,
  );
}

export class SupabaseApproachRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listAttempts(connectionId: string): Promise<ApproachAttempt[]> {
    const { data, error } = await this.supabase
      .from("approach_attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data.map(mapAttempt);
  }

  async create(
    connectionId: string,
    actorId: string,
    occurredAt: string,
    recordedAt: string,
  ): Promise<ApproachAttempt> {
    const { data, error } = await this.supabase.rpc("create_approach_attempt", {
      p_connection_id: connectionId,
      p_actor_id: actorId,
      p_occurred_at: occurredAt,
      p_recorded_at: recordedAt,
    });
    if (error) translate(error);
    return mapAttempt(data as AttemptRow);
  }

  async dispatch(
    attemptId: string,
    actorId: string,
    occurredAt: string,
    recordedAt: string,
  ): Promise<ApproachAttempt> {
    const { data, error } = await this.supabase.rpc("dispatch_approach_attempt", {
      p_attempt_id: attemptId,
      p_actor_id: actorId,
      p_occurred_at: occurredAt,
      p_recorded_at: recordedAt,
    });
    if (error) translate(error);
    return mapAttempt(data as AttemptRow);
  }

  async respond(
    attemptId: string,
    responseKind: ApproachResponseKind,
    responseSource: ApproachResponseSource,
    actorId: string,
    occurredAt: string,
    recordedAt: string,
  ): Promise<ApproachAttempt> {
    const { data, error } = await this.supabase.rpc("respond_approach_attempt", {
      p_attempt_id: attemptId,
      p_response_kind: responseKind,
      p_response_source: responseSource,
      p_actor_id: actorId,
      p_occurred_at: occurredAt,
      p_recorded_at: recordedAt,
    });
    if (error) translate(error);
    return mapAttempt(data as AttemptRow);
  }

  async cancel(
    attemptId: string,
    actorId: string,
    occurredAt: string,
    recordedAt: string,
  ): Promise<ApproachAttempt> {
    const { data, error } = await this.supabase.rpc("cancel_approach_attempt", {
      p_attempt_id: attemptId,
      p_actor_id: actorId,
      p_occurred_at: occurredAt,
      p_recorded_at: recordedAt,
    });
    if (error) translate(error);
    return mapAttempt(data as AttemptRow);
  }

  // -------------------------------------------------------------------------
  // Notificações — atenção e evidência, nunca obrigação
  // -------------------------------------------------------------------------

  async listNotifications(caseId: string): Promise<TeamNotification[]> {
    const { data, error } = await this.supabase
      .from("team_notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapNotification).filter((n): n is TeamNotification => n !== null);
  }

  /**
   * Marcar como lida registra que alguém viu — e nada além disso. Não altera
   * responsabilidade, não encerra tentativa e não conclui trabalho.
   */
  async markRead(notificationId: string, actorId: string, at: string): Promise<void> {
    const { error } = await this.supabase
      .from("team_notifications")
      .update({ read_at: at, read_by: actorId })
      .eq("id", notificationId)
      .is("read_at", null);
    if (error) throw erroDeBanco("Não foi possível marcar a notificação como lida.", error);
  }

  /** Arquivar tira da caixa. O trabalho pendente continua sendo derivado dos fatos. */
  async archive(notificationId: string, actorId: string, at: string): Promise<void> {
    const { error } = await this.supabase
      .from("team_notifications")
      .update({ archived_at: at, archived_by: actorId })
      .eq("id", notificationId)
      .is("archived_at", null);
    if (error) throw erroDeBanco("Não foi possível arquivar a notificação.", error);
  }
}
