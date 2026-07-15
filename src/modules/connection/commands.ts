// Comandos do domínio Connection — funções puras (sem React, sem banco,
// sem ACE/Curadoria/CI). Cada comando recebe o estado atual (quando
// aplicável) e um contexto já resolvido pelo chamador (ex.: quais
// profissionais são elegíveis para aquela FinalCuradoria — o domínio nunca
// consulta isso sozinho), e devolve o novo estado + o evento que o
// originou, ou lança ConnectionError. Eventos nunca alteram o passado —
// cada comando produz um evento novo, nunca edita um evento existente
// (Connection & Relationship, Fase 3, Princípio de Imutabilidade).

import { ConnectionError } from "./errors";
import {
  isTerminalConnectionStatus,
  isValidConnectionTransition,
} from "./state-machine";
import type {
  ConnectionRecord,
  ConnectionRecordDraft,
  CreateConnectionResult,
  UpdateConnectionResult,
} from "./types";

export type EligibilityContext = {
  // IDs de professional_profiles presentes na FinalCuradoria referenciada —
  // resolvidos pelo chamador (ex.: a partir de provider_presentations),
  // nunca pelo domínio (Invariante: "profissional deve pertencer à
  // Curadoria", validado aqui sem nenhuma consulta própria a banco).
  eligibleProfessionalProfileIds: readonly string[];
};

function assertProfessionalEligible(
  professionalProfileId: string,
  context: EligibilityContext,
): void {
  if (!context.eligibleProfessionalProfileIds.includes(professionalProfileId)) {
    throw new ConnectionError({
      code: "PROFESSIONAL_NOT_IN_DELIVERY",
      message: `professionalProfileId "${professionalProfileId}" não pertence aos profissionais apresentados nesta FinalCuradoria.`,
    });
  }
}

function assertOwner(
  record: ConnectionRecord,
  requestedByPatientProfileId: string,
): void {
  if (record.patientProfileId !== requestedByPatientProfileId) {
    throw new ConnectionError({
      code: "NOT_OWNER",
      message:
        "Somente o paciente proprietário deste Connection pode alterá-lo.",
    });
  }
}

function assertTransition(
  record: ConnectionRecord,
  to: ConnectionRecord["status"],
): void {
  if (isTerminalConnectionStatus(record.status)) {
    throw new ConnectionError({
      code: "TERMINAL_STATE",
      message: `Connection já está em um estado terminal (${record.status}) — nenhuma transição é permitida.`,
    });
  }

  if (!isValidConnectionTransition(record.status, to)) {
    throw new ConnectionError({
      code: "INVALID_TRANSITION",
      message: `Transição de ${record.status} para ${to} não é válida.`,
    });
  }
}

export type CreateConnectionInput = {
  caseId: string;
  finalCuradoriaDeliveryId: string;
  patientProfileId: string;
  professionalProfileId: string;
  actorId: string;
  occurredAt: string;
  recordedAt: string;
};

// CreateConnection — registra a decisão do paciente. Único ponto de
// entrada do domínio; a unicidade "um Connection por Caso" (Fase 2,
// Decisão 1) é garantida pelo índice único do banco (PR1), não checada
// aqui, pelo mesmo motivo que a máquina de estados não é a única fonte de
// verdade: o domínio valida o que pode sem I/O, o banco garante o resto.
export function createConnection(
  input: CreateConnectionInput,
  context: EligibilityContext,
): CreateConnectionResult {
  assertProfessionalEligible(input.professionalProfileId, context);

  const record: ConnectionRecordDraft = {
    caseId: input.caseId,
    finalCuradoriaDeliveryId: input.finalCuradoriaDeliveryId,
    patientProfileId: input.patientProfileId,
    professionalProfileId: input.professionalProfileId,
    status: "DECISAO_REGISTRADA",
    decidedAt: input.occurredAt,
  };

  return {
    record,
    event: {
      eventType: "DECISAO_REGISTRADA",
      actorId: input.actorId,
      payload: { professionalProfileId: input.professionalProfileId },
      occurredAt: input.occurredAt,
      recordedAt: input.recordedAt,
    },
  };
}

export type CorrectChoiceInput = {
  requestedByPatientProfileId: string;
  newProfessionalProfileId: string;
  actorId: string;
  occurredAt: string;
  recordedAt: string;
};

// CorrectChoice — só permitida em DECISAO_REGISTRADA (Fase 2, consequência
// da Decisão 1). Nunca edita o evento de escolha original; produz um novo
// evento CORRECAO_ESCOLHA que o referencia implicitamente pela ordem
// temporal (occurredAt/recordedAt), nunca por sobrescrita.
export function correctChoice(
  record: ConnectionRecord,
  input: CorrectChoiceInput,
  context: EligibilityContext,
): UpdateConnectionResult {
  assertOwner(record, input.requestedByPatientProfileId);

  if (record.status !== "DECISAO_REGISTRADA") {
    throw new ConnectionError({
      code: "CORRECTION_NOT_ALLOWED",
      message:
        "A escolha só pode ser corrigida enquanto o Connection estiver em DECISAO_REGISTRADA.",
    });
  }

  assertProfessionalEligible(input.newProfessionalProfileId, context);

  return {
    record: {
      ...record,
      professionalProfileId: input.newProfessionalProfileId,
    },
    event: {
      eventType: "CORRECAO_ESCOLHA",
      actorId: input.actorId,
      payload: { professionalProfileId: input.newProfessionalProfileId },
      occurredAt: input.occurredAt,
      recordedAt: input.recordedAt,
    },
  };
}

export type RegisterContactIntentInput = {
  requestedByPatientProfileId: string;
  actorId: string;
  occurredAt: string;
  recordedAt: string;
};

// RegisterContactIntent — sempre uma declaração do paciente, nunca
// verificada externamente (Fase 2, Decisão 3: o estado existe porque
// captura um fato comportamental real e não redundante).
export function registerContactIntent(
  record: ConnectionRecord,
  input: RegisterContactIntentInput,
): UpdateConnectionResult {
  assertOwner(record, input.requestedByPatientProfileId);
  assertTransition(record, "CONTATO_INICIADO");

  return {
    record: { ...record, status: "CONTATO_INICIADO" },
    event: {
      eventType: "CONTATO_INICIADO",
      actorId: input.actorId,
      payload: {},
      occurredAt: input.occurredAt,
      recordedAt: input.recordedAt,
    },
  };
}

export type ConfirmFirstAppointmentInput = {
  requestedByPatientProfileId: string;
  actorId: string;
  occurredAt: string;
  recordedAt: string;
};

// ConfirmFirstAppointment — somente o paciente (Fase 2, Decisão 2: nenhuma
// alternativa aumenta a confiabilidade do dado, que é sempre declaração).
// Estado terminal deste MVP; é o marco oficial de nascimento de um futuro
// Relationship (Fase 2, Decisão 4) — nenhum Relationship é criado aqui.
export function confirmFirstAppointment(
  record: ConnectionRecord,
  input: ConfirmFirstAppointmentInput,
): UpdateConnectionResult {
  assertOwner(record, input.requestedByPatientProfileId);
  assertTransition(record, "PRIMEIRO_ATENDIMENTO_REALIZADO");

  return {
    record: { ...record, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
    event: {
      eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
      actorId: input.actorId,
      payload: {},
      occurredAt: input.occurredAt,
      recordedAt: input.recordedAt,
    },
  };
}

export type CloseWithoutRelationshipInput = {
  requestedByPatientProfileId: string;
  actorId: string;
  occurredAt: string;
  recordedAt: string;
  reason?: string;
};

export function closeWithoutRelationship(
  record: ConnectionRecord,
  input: CloseWithoutRelationshipInput,
): UpdateConnectionResult {
  assertOwner(record, input.requestedByPatientProfileId);
  assertTransition(record, "ENCERRADO_SEM_RELACIONAMENTO");

  return {
    record: { ...record, status: "ENCERRADO_SEM_RELACIONAMENTO" },
    event: {
      eventType: "ENCERRADO_SEM_RELACIONAMENTO",
      actorId: input.actorId,
      payload: input.reason ? { reason: input.reason } : {},
      occurredAt: input.occurredAt,
      recordedAt: input.recordedAt,
    },
  };
}
