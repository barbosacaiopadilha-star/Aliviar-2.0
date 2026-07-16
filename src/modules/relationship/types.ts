// RELATIONSHIP ENGINE — MVP — PR2 (domínio puro). Vocabulário fechado
// alinhado à teoria definitiva (docs/architecture/DOMAIN_RELATIONSHIP.md,
// Veredito A, Fase 4.1) e à arquitetura técnica aprovada
// (docs/architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md).
//
// [CORRIGIDO — Fase 6.1] A versão anterior deste arquivo definia quatro
// estados (ATIVO/PAUSADO/ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO),
// construída sobre uma teoria de Relationship anterior ao fechamento da
// Fase 4.1. A teoria definitiva rejeita PAUSADO como estado (nenhuma
// consequência de domínio própria comprovada — permanece só hipótese de
// produto) e exige um único estado terminal ENCERRADO, com a distinção de
// motivo vivendo no evento, nunca no estado. Corrigido aqui — nenhum
// resíduo de PAUSADO/estado terminal duplo permanece.

export const RELATIONSHIP_STATUSES = ["ATIVO", "ENCERRADO"] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

export const RELATIONSHIP_TERMINAL_STATUSES = ["ENCERRADO"] as const;

export const RELATIONSHIP_EVENT_TYPES = [
  "RELACIONAMENTO_INICIADO",
  "ENCERRAMENTO_PLANEJADO_DECLARADO",
  "INTERRUPCAO_DECLARADA",
  "REABERTURA_OBSERVADA",
] as const;
export type RelationshipEventType = (typeof RELATIONSHIP_EVENT_TYPES)[number];

// RelationshipTerminationKind: a distinção de motivo (planejado vs. por
// interrupção) sobrevive como metadado do EVENTO de encerramento — nunca
// como estado (Fase 4.1: "Opção B — ENCERRADO com motivo específico,
// nunca um estado próprio"). Usado só para nomear o motivo, nunca para
// derivar um valor de `status`.
export const RELATIONSHIP_TERMINATION_KINDS = [
  "PLANEJADO",
  "POR_INTERRUPCAO",
] as const;
export type RelationshipTerminationKind =
  (typeof RELATIONSHIP_TERMINATION_KINDS)[number];

// RelationshipAuthor: formaliza em tipo a tabela de autoridade já
// aprovada (Fase 2/Etapa 1) — nunca uma nova regra de autorização, apenas
// nomeação estruturada do que já foi decidido. "sistema" carrega o
// actorId original do Connection (Fase 3/Etapa 5: "nunca um ator anônimo
// do sistema").
export type RelationshipAuthor =
  | { kind: "paciente"; patientProfileId: string }
  | { kind: "equipe"; teamMemberId: string }
  | { kind: "sistema"; actorId: string };

// ReopeningReference: a referência estrutural que REABERTURA_OBSERVADA
// sempre carrega (Fase 3/Etapa 11) — o novo Caso que fundamenta o
// registro, nunca inventado, nunca omitido.
export type ReopeningReference = {
  newCaseId: string;
};

export type RelationshipRecord = {
  id: string;
  connectionId: string;
  caseId: string;
  patientProfileId: string;
  professionalProfileId: string;
  status: RelationshipStatus;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RelationshipRecordDraft = Omit<
  RelationshipRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type RelationshipEvent = {
  id: number;
  relationshipId: string;
  eventType: RelationshipEventType;
  actorId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
};

export type RelationshipEventDraft = Omit<
  RelationshipEvent,
  "id" | "relationshipId"
>;

export type CreateRelationshipResult = {
  record: RelationshipRecordDraft;
  event: RelationshipEventDraft;
};

export type UpdateRelationshipResult = {
  record: RelationshipRecord;
  event: RelationshipEventDraft;
};

// registerReopening nunca altera relationship_records.status (Fase
// 3/Etapa 11) — por isso seu resultado carrega só o evento, nunca um
// record atualizado, diferente de UpdateRelationshipResult.
export type RegisterReopeningResult = {
  event: RelationshipEventDraft;
};

export type RelationshipActionResult =
  { success: true } | { success: false; error: string };
