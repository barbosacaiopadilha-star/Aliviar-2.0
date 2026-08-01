// ConnectionRepository — porta de infraestrutura (não pertence ao domínio
// puro, por isso vive em ports/, não junto de types.ts/commands.ts).
// O domínio conhece apenas esta interface, nunca uma implementação
// concreta (Supabase, banco, cache) — mesmo princípio de
// src/modules/ace/ports/provider-repository.ts (ADR-013).
//
// Nenhuma implementação existe nesta entrega (PR2). Fica para PR3.

import type {
  ConnectionEvent,
  ConnectionEventDraft,
  ConnectionRecord,
  ConnectionRecordDraft,
  ConnectionStatus,
  ContactMode,
} from "../types";

export interface ConnectionRepository {
  findById(connectionId: string): Promise<ConnectionRecord | null>;
  findByCaseId(caseId: string): Promise<ConnectionRecord | null>;
  listEvents(connectionId: string): Promise<ConnectionEvent[]>;
  create(
    record: ConnectionRecordDraft,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord>;
  // `previousStatus` — adicionado no PR3 (achado da Etapa 1: a assinatura
  // original do PR2 não carregava informação suficiente para o repository
  // implementar concorrência otimista). É o status lido antes de chamar o
  // comando puro do domínio; a implementação concreta usa esse valor como
  // pré-condição da atualização (WHERE status = previousStatus), detectando
  // uma transição concorrente sem precisar de uma transação explícita do
  // lado do cliente.
  update(
    previousStatus: ConnectionStatus,
    record: ConnectionRecord,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord>;
  // Incremento 1 da Continuidade Pós-Decisão. Separado de `update` porque
  // definir o modo NÃO é transição: o status não muda. `expectedMode` é a
  // pré-condição de concorrência otimista, no mesmo espírito de
  // `previousStatus`.
  setContactMode(
    connectionId: string,
    expectedMode: ContactMode | null,
    newMode: ContactMode,
    event: ConnectionEventDraft,
  ): Promise<ConnectionRecord>;
}
