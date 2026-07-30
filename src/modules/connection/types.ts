// Tipos do domínio Connection (MVP, Fase 2 da especificação) — o primeiro
// elo entre a entrega da FinalCuradoria e o eventual nascimento de um
// Relationship (não implementado nesta entrega). Espelha exatamente a
// estrutura definitiva aprovada: um ConnectionRecord por Caso (identidade =
// caseId), estado atual denormalizado + histórico de eventos append-only
// (mesmo padrão já em produção em `cases`/`case_notes`).
//
// IDs e timestamps gerados pelo banco (PR1: `default gen_random_uuid()`,
// `default now()`) nunca são produzidos aqui — os "Draft" abaixo modelam
// exatamente o que o domínio pode calcular sem I/O; o repository (fora
// deste módulo) é quem persiste e devolve o registro/evento hidratado.

export const CONNECTION_STATUSES = [
  "DECISAO_REGISTRADA",
  "CONTATO_INICIADO",
  "PRIMEIRO_ATENDIMENTO_REALIZADO",
  "ENCERRADO_SEM_RELACIONAMENTO",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

// Nasce oficialmente um Relationship (Fase 2, Decisão 4) — não implementado
// nesta entrega; apenas o marco fica identificado para uso futuro.
export const RELATIONSHIP_BIRTH_STATUS: ConnectionStatus =
  "PRIMEIRO_ATENDIMENTO_REALIZADO";

export const CONNECTION_EVENT_TYPES = [
  "DECISAO_REGISTRADA",
  "CORRECAO_ESCOLHA",
  "CONTATO_INICIADO",
  "PRIMEIRO_ATENDIMENTO_REALIZADO",
  "ENCERRADO_SEM_RELACIONAMENTO",
] as const;

export type ConnectionEventType = (typeof CONNECTION_EVENT_TYPES)[number];

/**
 * Onde a Connection se prende à entrega que a originou.
 *
 * União porque as duas fontes ancoram em registros diferentes: o caminho
 * canônico no Relatório do Método, o legado no registro histórico do motor
 * antigo. Nunca as duas — o banco recusa pela constraint
 * `connection_records_exactly_one_anchor`.
 */
export type ConnectionAnchor =
  | { source: "METODO"; reportId: string }
  | { source: "ACE_LEGADO"; finalDeliveryId: string };

export type ConnectionRecord = {
  id: string;
  caseId: string;
  anchor: ConnectionAnchor;
  patientProfileId: string;
  professionalProfileId: string;
  status: ConnectionStatus;
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
};

// O que o domínio consegue calcular sem banco, ao criar um Connection —
// sem id/createdAt/updatedAt, que o banco atribui (PR1).
export type ConnectionRecordDraft = Omit<
  ConnectionRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type ConnectionEvent = {
  id: number;
  connectionId: string;
  eventType: ConnectionEventType;
  actorId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
};

// O que o domínio consegue calcular sem banco, ao registrar um evento —
// sem id (bigint identity, atribuído pelo banco) nem connectionId (só
// conhecido depois que o ConnectionRecord de criação for persistido).
export type ConnectionEventDraft = Omit<ConnectionEvent, "id" | "connectionId">;

// Resultado de todo comando do domínio: o novo estado do registro (ou o
// rascunho, na criação) mais o evento (ou rascunho de evento) que o
// originou — nunca um sem o outro (Invariante: todo estado nasce de um
// evento rastreável, Connection & Relationship Fase 2/3).
export type CreateConnectionResult = {
  record: ConnectionRecordDraft;
  event: ConnectionEventDraft;
};

export type UpdateConnectionResult = {
  record: ConnectionRecord;
  event: ConnectionEventDraft;
};

// Resposta estruturada das Server Actions (PR3) — mesmo formato de
// ConciergeActionResult/CaseActionResult: nunca vaza stack trace, ID
// interno desnecessário ou detalhe de banco.
export type ConnectionActionResult =
  { success: true } | { success: false; error: string };
