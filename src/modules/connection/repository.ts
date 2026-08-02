import "server-only";
import { erroDeBanco } from "@/lib/observability/erros";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { RelationshipEventDraft } from "@/modules/relationship";

import { ConnectionError } from "./errors";
import type { ConnectionRepository } from "./ports/connection-repository";
import {
  CONNECTION_EVENT_TYPES,
  CONNECTION_STATUSES,
  isContactMode,
  type ConnectionEvent,
  type ConnectionEventDraft,
  type ConnectionEventType,
  type ConnectionRecord,
  type ConnectionRecordDraft,
  type ConnectionStatus,
  type ContactMode,
} from "./types";

const RECORD_COLUMNS =
  "id, case_id, curadoria_report_id, final_curadoria_delivery_id, patient_profile_id, professional_profile_id, status, contact_mode, decided_at, created_at, updated_at";
const EVENT_COLUMNS =
  "id, connection_id, event_type, actor_id, payload, occurred_at, recorded_at";

type ConnectionRecordRow = {
  id: string;
  case_id: string;
  curadoria_report_id: string | null;
  final_curadoria_delivery_id: string | null;
  patient_profile_id: string;
  professional_profile_id: string;
  status: string;
  contact_mode: string | null;
  decided_at: string;
  created_at: string;
  updated_at: string;
};

type ConnectionEventRow = {
  id: number;
  connection_id: string;
  event_type: string;
  actor_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  recorded_at: string;
};

// Nenhum valor desconhecido persistido no banco é aceito silenciosamente
// pelo domínio (Etapa 3 do PR3) — um status ou tipo de evento fora do
// conjunto fechado lança erro explícito em vez de ser repassado como
// string qualquer.
function assertKnownStatus(value: string): asserts value is ConnectionStatus {
  if (!(CONNECTION_STATUSES as readonly string[]).includes(value)) {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: `Valor de status desconhecido persistido no banco: "${value}".`,
    });
  }
}

function assertKnownEventType(
  value: string,
): asserts value is ConnectionEventType {
  if (!(CONNECTION_EVENT_TYPES as readonly string[]).includes(value)) {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: `Tipo de evento desconhecido persistido no banco: "${value}".`,
    });
  }
}

function mapRecordRow(row: ConnectionRecordRow): ConnectionRecord {
  assertKnownStatus(row.status);
  return {
    id: row.id,
    caseId: row.case_id,
    // O banco garante exatamente uma das duas (connection_records_exactly_one_anchor),
    // então o canônico primeiro e o legado como o outro caso é exaustivo.
    anchor: row.curadoria_report_id
      ? { source: "METODO", reportId: row.curadoria_report_id }
      : { source: "ACE_LEGADO", finalDeliveryId: row.final_curadoria_delivery_id ?? "" },
    patientProfileId: row.patient_profile_id,
    professionalProfileId: row.professional_profile_id,
    status: row.status,
    // `null` nunca vira um dos dois modos: ausência de escolha permanece
    // ausência. Valor desconhecido persistido também não é adivinhado — a
    // leitura degrada para "não definido", nunca para um padrão.
    contactMode: isContactMode(row.contact_mode) ? row.contact_mode : null,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRow(row: ConnectionEventRow): ConnectionEvent {
  assertKnownEventType(row.event_type);
  return {
    id: row.id,
    connectionId: row.connection_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    payload: row.payload,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
  };
}

// Adaptação concreta de ConnectionRepository sobre a persistência do PR1.
// Responsável apenas por persistir e reconstruir objetos — nunca decide
// transição, nunca duplica a máquina de estados (isso vive inteiramente em
// state-machine.ts/commands.ts, PR2). As duas escritas atômicas (create,
// update) delegam para as funções de banco do PR3
// (create_connection_with_event, apply_connection_transition) — nunca
// fazem .insert()/.update() separados que pudessem gravar parcialmente.
export class SupabaseConnectionRepository implements ConnectionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(connectionId: string): Promise<ConnectionRecord | null> {
    const { data, error } = await this.supabase
      .from("connection_records")
      .select(RECORD_COLUMNS)
      .eq("id", connectionId)
      .maybeSingle();

    if (error) throw erroDeBanco("Não foi possível consultar o Connection.", error);
    return data ? mapRecordRow(data as ConnectionRecordRow) : null;
  }

  async findByCaseId(caseId: string): Promise<ConnectionRecord | null> {
    const { data, error } = await this.supabase
      .from("connection_records")
      .select(RECORD_COLUMNS)
      .eq("case_id", caseId)
      .maybeSingle();

    if (error)
      throw erroDeBanco("Não foi possível consultar o Connection deste Caso.", error);
    return data ? mapRecordRow(data as ConnectionRecordRow) : null;
  }

  async listEvents(connectionId: string): Promise<ConnectionEvent[]> {
    const { data, error } = await this.supabase
      .from("connection_events")
      .select(EVENT_COLUMNS)
      .eq("connection_id", connectionId)
      .order("occurred_at", { ascending: true });

    if (error)
      throw new Error(
        "Não foi possível consultar o histórico deste Connection.",
      );
    return (data ?? []).map((row) => mapEventRow(row as ConnectionEventRow));
  }

  async create(
    record: ConnectionRecordDraft,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord> {
    // Caminho canônico: a função deriva Case e paciente do próprio Relatório,
    // e é idempotente — repetir a mesma escolha devolve a Connection existente
    // em vez de tentar criar uma segunda.
    const { data, error } =
      record.anchor.source === "METODO"
        ? await this.supabase.rpc("create_connection_from_report", {
            p_report_id: record.anchor.reportId,
            p_professional_profile_id: record.professionalProfileId,
            p_decided_at: record.decidedAt,
            p_actor_id: event.actorId,
            p_event_payload: event.payload,
            p_occurred_at: event.occurredAt,
            p_recorded_at: event.recordedAt,
          })
        : await this.supabase.rpc("create_connection_with_event", {
            p_case_id: record.caseId,
            p_final_curadoria_delivery_id: record.anchor.finalDeliveryId,
            p_patient_profile_id: record.patientProfileId,
            p_professional_profile_id: record.professionalProfileId,
            p_decided_at: record.decidedAt,
            p_actor_id: event.actorId,
            p_event_payload: event.payload,
            p_occurred_at: event.occurredAt,
            p_recorded_at: event.recordedAt,
          });

    // Escrita pela âncora legada não deveria mais acontecer em caso novo. Não
    // bloqueia — um Caso antigo legitimamente passa por aqui —, mas fica
    // visível, porque uma escrita legada silenciosa é como a dependência
    // reapareceria sem ninguém notar.
    if (record.anchor.source === "ACE_LEGADO" && !error) {
      console.warn(
        "[connection] escrita pela âncora legada (final_curadoria_delivery_id)",
        { caseId: record.caseId },
      );
    }

    if (error) {
      // 23505 = connection_records_case_id_key (PR1) — este Caso já possui
      // um Connection (Fase 2, Decisão 1: um por Caso).
      if (error.code === "23505") {
        throw new ConnectionError({
          code: "INVALID_TRANSITION",
          message: "Este Caso já possui um Connection registrado.",
        });
      }
      throw erroDeBanco("Não foi possível registrar a decisão de Connection.", error);
    }

    return mapRecordRow(data as ConnectionRecordRow);
  }

  async update(
    previousStatus: ConnectionStatus,
    record: ConnectionRecord,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord> {
    const { data, error } = await this.supabase.rpc(
      "apply_connection_transition",
      {
        p_connection_id: record.id,
        p_expected_status: previousStatus,
        p_new_status: record.status,
        p_professional_profile_id: record.professionalProfileId,
        p_event_type: event.eventType,
        p_actor_id: event.actorId,
        p_payload: event.payload,
        p_occurred_at: event.occurredAt,
        p_recorded_at: event.recordedAt,
      },
    );

    if (error) {
      // 55000 = errcode explícito da própria função (apply_connection_transition,
      // PR3) para transição concorrente — nunca confundido com um erro de
      // domínio comum.
      if (error.code === "55000") {
        throw new ConnectionError({
          code: "CONCURRENT_CONFLICT",
          message: "Este Connection foi alterado por outra ação simultânea.",
        });
      }
      throw new Error(
        "Não foi possível registrar esta alteração de Connection.",
      );
    }

    return mapRecordRow(data as ConnectionRecordRow);
  }

  /**
   * Modo de contato + evento na mesma transação (RPC
   * `set_connection_contact_mode`). Não é `update()` porque não é transição:
   * o status permanece exatamente o mesmo, e reaproveitar
   * `apply_connection_transition` obrigaria a fingir uma.
   */
  async setContactMode(
    connectionId: string,
    expectedMode: ContactMode | null,
    newMode: ContactMode,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord> {
    const { data, error } = await this.supabase.rpc(
      "set_connection_contact_mode",
      {
        p_connection_id: connectionId,
        p_expected_mode: expectedMode,
        p_new_mode: newMode,
        p_actor_id: event.actorId,
        p_occurred_at: event.occurredAt,
        p_recorded_at: event.recordedAt,
      },
    );

    if (error) {
      if (error.code === "55000") {
        throw new ConnectionError({
          code: "CONCURRENT_CONFLICT",
          message: "Este Connection foi alterado por outra ação simultânea.",
        });
      }
      if (error.code === "23514") {
        throw new ConnectionError({
          code: "CONTACT_MODE_NOT_ALLOWED",
          message:
            "O modo de contato não pode mais ser definido para este Connection.",
        });
      }
      throw erroDeBanco("Não foi possível registrar o modo de contato.", error);
    }

    return mapRecordRow(data as ConnectionRecordRow);
  }

  // RELATIONSHIP ENGINE — PR4 (nascimento automático). Único ponto de
  // toque de Connection sobre Relationship em toda a base — chama a
  // função transacional dedicada (confirm_first_appointment_and_birth_
  // relationship, PR4) em vez de apply_connection_transition, apenas para
  // esta transição específica. Nunca faz duas chamadas separadas (update
  // do Connection e depois create do Relationship) — os dois efeitos são
  // uma única escrita atômica no banco. Retorna o ConnectionRecord (esta
  // classe já sabe mapeá-lo) e a linha bruta de relationship_records, que
  // quem chamar pode reconstruir via
  // reconstructRelationshipRecordFromRow (relationship/repository.ts) —
  // sem nenhuma segunda gravação.
  async confirmFirstAppointmentAndBirthRelationship(
    previousStatus: ConnectionStatus,
    record: ConnectionRecord,
    connectionEvent: ConnectionEventDraft,
    relationshipEvent: RelationshipEventDraft,
  ): Promise<{ connection: ConnectionRecord; relationshipRow: unknown }> {
    const { data, error } = await this.supabase.rpc(
      "confirm_first_appointment_and_birth_relationship",
      {
        p_connection_id: record.id,
        p_expected_status: previousStatus,
        p_actor_id: connectionEvent.actorId,
        p_connection_event_payload: connectionEvent.payload,
        p_relationship_event_payload: relationshipEvent.payload,
        p_occurred_at: connectionEvent.occurredAt,
        p_recorded_at: connectionEvent.recordedAt,
      },
    );

    if (error) {
      // 55000 = mesma semântica de concorrência otimista de
      // apply_connection_transition, agora também cobrindo a criação do
      // Relationship na mesma transação.
      if (error.code === "55000") {
        throw new ConnectionError({
          code: "CONCURRENT_CONFLICT",
          message: "Este Connection foi alterado por outra ação simultânea.",
        });
      }
      throw erroDeBanco("Não foi possível confirmar o primeiro atendimento.", error);
    }

    const [row] = data as Array<{
      connection_record: ConnectionRecordRow;
      relationship_record: unknown;
    }>;

    return {
      connection: mapRecordRow(row.connection_record),
      relationshipRow: row.relationship_record,
    };
  }
}
