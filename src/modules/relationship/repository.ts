import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import { RelationshipError } from "./errors";
import type { RelationshipRepository } from "./ports/relationship-repository";
import {
  RELATIONSHIP_EVENT_TYPES,
  RELATIONSHIP_STATUSES,
  type RelationshipEvent,
  type RelationshipEventDraft,
  type RelationshipEventType,
  type RelationshipRecord,
  type RelationshipRecordDraft,
  type RelationshipStatus,
} from "./types";

const RECORD_COLUMNS =
  "id, connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at, created_at, updated_at";
const EVENT_COLUMNS =
  "id, relationship_id, event_type, actor_id, payload, occurred_at, recorded_at";

type RelationshipRecordRow = {
  id: string;
  connection_id: string;
  case_id: string;
  patient_profile_id: string;
  professional_profile_id: string;
  status: string;
  started_at: string;
  created_at: string;
  updated_at: string;
};

type RelationshipEventRow = {
  id: number;
  relationship_id: string;
  event_type: string;
  actor_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  recorded_at: string;
};

// Nenhum valor desconhecido persistido no banco é aceito silenciosamente
// pelo domínio (mesmo princípio já usado por connection/repository.ts) —
// um status ou tipo de evento fora do conjunto fechado lança erro
// explícito em vez de ser repassado como string qualquer.
function assertKnownStatus(value: string): asserts value is RelationshipStatus {
  if (!(RELATIONSHIP_STATUSES as readonly string[]).includes(value)) {
    throw new RelationshipError({
      code: "INVALID_TRANSITION",
      message: `Valor de status desconhecido persistido no banco: "${value}".`,
    });
  }
}

function assertKnownEventType(
  value: string,
): asserts value is RelationshipEventType {
  if (!(RELATIONSHIP_EVENT_TYPES as readonly string[]).includes(value)) {
    throw new RelationshipError({
      code: "INVALID_TRANSITION",
      message: `Tipo de evento desconhecido persistido no banco: "${value}".`,
    });
  }
}

function mapRecordRow(row: RelationshipRecordRow): RelationshipRecord {
  assertKnownStatus(row.status);
  return {
    id: row.id,
    connectionId: row.connection_id,
    caseId: row.case_id,
    patientProfileId: row.patient_profile_id,
    professionalProfileId: row.professional_profile_id,
    status: row.status,
    startedAt: row.started_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// RELATIONSHIP ENGINE — PR4 (nascimento automático). Reconstrói um
// RelationshipRecord a partir da linha bruta já retornada pela função
// transacional de Connection
// (confirm_first_appointment_and_birth_relationship) — nunca faz uma
// segunda gravação nem uma segunda consulta ao banco; apenas reaproveita
// a mesma validação/mapeamento (assertKnownStatus) já usada por todo o
// resto deste repository. Existe para que connection/repository.ts nunca
// precise reimplementar a lógica de mapeamento de uma linha de
// relationship_records — o único acoplamento permitido na direção
// Connection → Relationship é este, puramente de leitura/reconstrução.
export function reconstructRelationshipRecordFromRow(
  row: unknown,
): RelationshipRecord {
  return mapRecordRow(row as RelationshipRecordRow);
}

function mapEventRow(row: RelationshipEventRow): RelationshipEvent {
  assertKnownEventType(row.event_type);
  return {
    id: row.id,
    relationshipId: row.relationship_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    payload: row.payload,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
  };
}

// Adaptação concreta de RelationshipRepository sobre a persistência do
// PR1. Responsável apenas por persistir e reconstruir objetos — nunca
// decide transição, nunca duplica a máquina de estados (isso vive
// inteiramente em state-machine.ts/commands.ts, PR2). As três escritas
// atômicas (create, update, registerReopening) delegam para as funções de
// banco do PR1 (create_relationship_with_event,
// apply_relationship_transition, register_relationship_reopening) —
// nunca fazem .insert()/.update() separados que pudessem gravar
// parcialmente.
export class SupabaseRelationshipRepository implements RelationshipRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(relationshipId: string): Promise<RelationshipRecord | null> {
    const { data, error } = await this.supabase
      .from("relationship_records")
      .select(RECORD_COLUMNS)
      .eq("id", relationshipId)
      .maybeSingle();

    if (error) throw erroDeBanco("Não foi possível consultar o Relationship.", error);
    return data ? mapRecordRow(data as RelationshipRecordRow) : null;
  }

  async findByCaseId(caseId: string): Promise<RelationshipRecord | null> {
    const { data, error } = await this.supabase
      .from("relationship_records")
      .select(RECORD_COLUMNS)
      .eq("case_id", caseId)
      .maybeSingle();

    if (error)
      throw erroDeBanco("Não foi possível consultar o Relationship deste Caso.", error);
    return data ? mapRecordRow(data as RelationshipRecordRow) : null;
  }

  async listEvents(relationshipId: string): Promise<RelationshipEvent[]> {
    const { data, error } = await this.supabase
      .from("relationship_events")
      .select(EVENT_COLUMNS)
      .eq("relationship_id", relationshipId)
      .order("occurred_at", { ascending: true });

    if (error)
      throw new Error(
        "Não foi possível consultar o histórico deste Relationship.",
      );
    return (data ?? []).map((row) => mapEventRow(row as RelationshipEventRow));
  }

  async create(
    record: RelationshipRecordDraft,
    event: RelationshipEventDraft,
  ): Promise<RelationshipRecord> {
    const { data, error } = await this.supabase.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: record.connectionId,
        p_actor_id: event.actorId,
        p_event_payload: event.payload,
        p_occurred_at: event.occurredAt,
        p_recorded_at: event.recordedAt,
      },
    );

    if (error) {
      // 23505 = relationship_records_connection_id_key (PR1) — este
      // Connection já possui um Relationship (relação 1:1).
      if (error.code === "23505") {
        throw new RelationshipError({
          code: "RELATIONSHIP_ALREADY_EXISTS",
          message: "Este Connection já possui um Relationship registrado.",
        });
      }
      // 23503 = FK inexistente (connection_id não encontrado); 23514 =
      // assert_relationship_matches_connection (Connection não está em
      // PRIMEIRO_ATENDIMENTO_REALIZADO, ou campos divergentes) — ambos
      // significam, do ponto de vista de quem chama, que o Connection
      // referenciado não é válido para originar um Relationship agora.
      if (error.code === "23503" || error.code === "23514") {
        throw new RelationshipError({
          code: "CONNECTION_INVALID",
          message:
            "O Connection referenciado não é válido para originar um Relationship.",
        });
      }
      throw erroDeBanco("Não foi possível registrar o Relationship.", error);
    }

    return mapRecordRow(data as RelationshipRecordRow);
  }

  async update(
    previousStatus: RelationshipStatus,
    record: RelationshipRecord,
    event: RelationshipEventDraft,
  ): Promise<RelationshipRecord> {
    const { data, error } = await this.supabase.rpc(
      "apply_relationship_transition",
      {
        p_relationship_id: record.id,
        p_expected_status: previousStatus,
        p_new_status: record.status,
        p_event_type: event.eventType,
        p_actor_id: event.actorId,
        p_payload: event.payload,
        p_occurred_at: event.occurredAt,
        p_recorded_at: event.recordedAt,
      },
    );

    if (error) {
      // 55000 = errcode explícito da própria função
      // (apply_relationship_transition, PR1) para transição concorrente —
      // nunca confundido com um erro de domínio comum.
      if (error.code === "55000") {
        throw new RelationshipError({
          code: "CONCURRENT_CONFLICT",
          message: "Este Relationship foi alterado por outra ação simultânea.",
        });
      }
      throw new Error(
        "Não foi possível registrar esta alteração de Relationship.",
      );
    }

    return mapRecordRow(data as RelationshipRecordRow);
  }

  async registerReopening(
    relationshipId: string,
    event: RelationshipEventDraft,
  ): Promise<RelationshipEvent> {
    const payload = event.payload as { newCaseId?: unknown };
    const newCaseId =
      typeof payload.newCaseId === "string" ? payload.newCaseId : null;

    if (!newCaseId) {
      // Defesa em profundidade — o domínio (registerReopening,
      // commands.ts) já garante que newCaseId sempre existe no payload;
      // isto nunca deveria disparar se o repository for chamado
      // corretamente (mesma disciplina de "nunca confiar silenciosamente
      // em dado que deveria ter sido validado antes").
      throw new RelationshipError({
        code: "INVALID_REOPEN",
        message: "Reabertura exige newCaseId no payload do evento.",
      });
    }

    const { data, error } = await this.supabase.rpc(
      "register_relationship_reopening",
      {
        p_relationship_id: relationshipId,
        p_new_case_id: newCaseId,
        p_actor_id: event.actorId,
        p_payload: event.payload,
        p_occurred_at: event.occurredAt,
        p_recorded_at: event.recordedAt,
      },
    );

    if (error) {
      // 23503 = relationship_id ou o novo Caso não encontrado; 23514 =
      // Relationship não está terminal — ambos mapeiam para o mesmo
      // código de domínio (a reabertura, como solicitada, é inválida).
      if (error.code === "23503" || error.code === "23514") {
        throw new RelationshipError({
          code: "INVALID_REOPEN",
          message: "Não foi possível registrar esta reabertura.",
        });
      }
      throw erroDeBanco("Não foi possível registrar a reabertura observada.", error);
    }

    return mapEventRow(data as RelationshipEventRow);
  }
}
