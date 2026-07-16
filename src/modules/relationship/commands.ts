// RELATIONSHIP ENGINE — MVP — PR2. Comandos do domínio — funções puras
// (sem React, sem banco, sem Connection/ACE/Curadoria/CI). Cada comando
// recebe o estado atual (quando aplicável) e um autor já resolvido pelo
// chamador (RelationshipAuthor — o domínio nunca consulta sessão, papel
// ou banco para descobrir quem está agindo), e devolve o novo estado + o
// evento que o originou, ou lança RelationshipError. Eventos nunca
// alteram o passado — cada comando produz um evento novo, nunca edita um
// evento existente (mesmo Princípio de Imutabilidade já usado em
// Connection & Relationship, Fase 3).

import { RelationshipError } from "./errors";
import {
  canRegisterReopening,
  isTerminalRelationshipStatus,
  isValidRelationshipTransition,
} from "./state-machine";
import type {
  CreateRelationshipResult,
  RegisterReopeningResult,
  RelationshipAuthor,
  RelationshipEventDraft,
  RelationshipRecord,
  RelationshipRecordDraft,
  ReopeningReference,
  UpdateRelationshipResult,
} from "./types";

function assertOwnerPatient(
  record: RelationshipRecord,
  author: RelationshipAuthor,
): asserts author is Extract<RelationshipAuthor, { kind: "paciente" }> {
  if (
    author.kind !== "paciente" ||
    author.patientProfileId !== record.patientProfileId
  ) {
    throw new RelationshipError({
      code: "INVALID_AUTHOR",
      message:
        "Somente o paciente proprietário deste Relationship pode realizar esta ação.",
    });
  }
}

// Única autoria compartilhada do domínio (Fase 2/Etapa 1: exceção
// justificada para cobrir o caso de paciente inalcançável, sem inferir
// por silêncio).
function assertOwnerPatientOrTeam(
  record: RelationshipRecord,
  author: RelationshipAuthor,
): asserts author is Extract<
  RelationshipAuthor,
  { kind: "paciente" } | { kind: "equipe" }
> {
  const isOwnerPatient =
    author.kind === "paciente" &&
    author.patientProfileId === record.patientProfileId;
  const isTeam = author.kind === "equipe";

  if (!isOwnerPatient && !isTeam) {
    throw new RelationshipError({
      code: "INVALID_AUTHOR",
      message:
        "Somente o paciente proprietário ou a equipe podem registrar uma interrupção.",
    });
  }
}

function assertTeam(
  author: RelationshipAuthor,
): asserts author is Extract<RelationshipAuthor, { kind: "equipe" }> {
  if (author.kind !== "equipe") {
    throw new RelationshipError({
      code: "INVALID_AUTHOR",
      message: "Somente a equipe pode registrar esta ação.",
    });
  }
}

function assertSistema(
  author: RelationshipAuthor,
): asserts author is Extract<RelationshipAuthor, { kind: "sistema" }> {
  if (author.kind !== "sistema") {
    throw new RelationshipError({
      code: "INVALID_AUTHOR",
      message:
        "createRelationship só pode ser invocado mecanicamente pelo sistema.",
    });
  }
}

function assertTransition(
  record: RelationshipRecord,
  to: RelationshipRecord["status"],
): void {
  if (isTerminalRelationshipStatus(record.status)) {
    throw new RelationshipError({
      code: "RELATIONSHIP_NOT_ACTIVE",
      message: `Relationship já está em um estado terminal (${record.status}) — nenhuma transição é permitida.`,
    });
  }

  if (!isValidRelationshipTransition(record.status, to)) {
    throw new RelationshipError({
      code: "INVALID_TRANSITION",
      message: `Transição de ${record.status} para ${to} não é válida.`,
    });
  }
}

export type CreateRelationshipInput = {
  connectionId: string;
  caseId: string;
  patientProfileId: string;
  professionalProfileId: string;
  author: RelationshipAuthor;
  occurredAt: string;
  recordedAt: string;
};

// Nascimento mecânico — nunca uma decisão humana (Fase 3/Etapa 10: "quem
// detecta a transição? a própria camada que já persiste a transição do
// Connection"). O domínio não valida que o Connection de origem está em
// PRIMEIRO_ATENDIMENTO_REALIZADO nem que ainda não existe um Relationship
// para ele — essas duas garantias pertencem à camada de persistência
// (trigger + RPC, PR1), que lê o Connection e o índice único reais; o
// domínio puro nunca consulta banco.
export function createRelationship(
  input: CreateRelationshipInput,
): CreateRelationshipResult {
  assertSistema(input.author);

  const record: RelationshipRecordDraft = {
    connectionId: input.connectionId,
    caseId: input.caseId,
    patientProfileId: input.patientProfileId,
    professionalProfileId: input.professionalProfileId,
    status: "ATIVO",
    startedAt: input.occurredAt,
  };

  const event: RelationshipEventDraft = {
    eventType: "RELACIONAMENTO_INICIADO",
    actorId: input.author.actorId,
    payload: {},
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  };

  return { record, event };
}

export type ClosePlannedInput = {
  author: RelationshipAuthor;
  occurredAt: string;
  recordedAt: string;
};

// Encerramento consciente — autoria exclusiva do paciente (Fase 2/Etapa 5:
// nenhuma exceção, diferente de registerInterruption).
export function closePlanned(
  record: RelationshipRecord,
  input: ClosePlannedInput,
): UpdateRelationshipResult {
  assertOwnerPatient(record, input.author);
  assertTransition(record, "ENCERRADO");

  const event: RelationshipEventDraft = {
    eventType: "ENCERRAMENTO_PLANEJADO_DECLARADO",
    actorId: input.author.patientProfileId,
    payload: {},
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  };

  return { record: { ...record, status: "ENCERRADO" }, event };
}

export type RegisterInterruptionInput = {
  author: RelationshipAuthor;
  // Obrigatória quando author.kind === "equipe" (Fase 3/Etapa 8: "quando o
  // ator é equipe, o payload do evento deve conter uma observação
  // obrigatória" — preserva rastreabilidade de por que a equipe agiu no
  // lugar do paciente). Opcional quando o próprio paciente declara.
  observation: string | null;
  occurredAt: string;
  recordedAt: string;
};

export function registerInterruption(
  record: RelationshipRecord,
  input: RegisterInterruptionInput,
): UpdateRelationshipResult {
  assertOwnerPatientOrTeam(record, input.author);

  if (input.author.kind === "equipe" && !input.observation) {
    throw new RelationshipError({
      code: "INVALID_TERMINATION",
      message:
        "Quando a equipe registra uma interrupção em nome do paciente, uma observação é obrigatória.",
    });
  }

  assertTransition(record, "ENCERRADO");

  const actorId =
    input.author.kind === "paciente"
      ? input.author.patientProfileId
      : input.author.teamMemberId;

  const event: RelationshipEventDraft = {
    eventType: "INTERRUPCAO_DECLARADA",
    actorId,
    payload: input.observation ? { observation: input.observation } : {},
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  };

  return { record: { ...record, status: "ENCERRADO" }, event };
}

export type RegisterReopeningInput = {
  author: RelationshipAuthor;
  reference: ReopeningReference;
  occurredAt: string;
  recordedAt: string;
};

// Nunca altera relationship_records.status (Fase 3/Etapa 11: "não altera
// o Relationship anterior") — só produz um evento novo, sempre contra um
// Relationship já terminal, sempre vinculado a um novo Caso real.
export function registerReopening(
  record: RelationshipRecord,
  input: RegisterReopeningInput,
): RegisterReopeningResult {
  assertTeam(input.author);

  if (!canRegisterReopening(record.status)) {
    throw new RelationshipError({
      code: "INVALID_REOPEN",
      message: `Reabertura só pode ser registrada contra um Relationship terminal (atual: ${record.status}).`,
    });
  }

  if (
    !input.reference.newCaseId ||
    input.reference.newCaseId.trim().length === 0
  ) {
    throw new RelationshipError({
      code: "INVALID_REOPEN",
      message:
        "Reabertura exige a referência de um novo Caso real — newCaseId não pode ser vazio.",
    });
  }

  const event: RelationshipEventDraft = {
    eventType: "REABERTURA_OBSERVADA",
    actorId: input.author.teamMemberId,
    payload: { newCaseId: input.reference.newCaseId },
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  };

  return { event };
}
