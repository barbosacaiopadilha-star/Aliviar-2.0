// RELATIONSHIP ENGINE — MVP — PR2/PR3. Porta pura — apenas a interface. O
// domínio depende exclusivamente deste contrato, nunca de uma
// implementação concreta (Supabase, RPC, etc.) — a implementação
// concreta vive em repository.ts (PR3), mesmo padrão já usado por
// ConnectionRepository.
//
// Achado da auditoria prévia do PR3 (Etapa 1): a lista mínima de 5
// métodos do PR2 não cobre `registerReopening` — reabertura tem um
// formato estruturalmente distinto de `update()` (nunca retorna um
// `record` atualizado, porque nunca altera `status`; ver
// `RegisterReopeningResult` em types.ts). Esta é uma extensão puramente
// aditiva do contrato (nenhum método existente muda de assinatura ou
// comportamento) — mesmo precedente já usado quando o PR3 do Connection
// encontrou e resolveu, da mesma forma, uma lacuna equivalente em
// `ConnectionRepository.update()` (adição de `previousStatus`).

import type {
  RelationshipEvent,
  RelationshipEventDraft,
  RelationshipRecord,
  RelationshipRecordDraft,
} from "../types";

export interface RelationshipRepository {
  findById(relationshipId: string): Promise<RelationshipRecord | null>;
  findByCaseId(caseId: string): Promise<RelationshipRecord | null>;
  listEvents(relationshipId: string): Promise<RelationshipEvent[]>;
  create(
    record: RelationshipRecordDraft,
    event: RelationshipEventDraft,
  ): Promise<RelationshipRecord>;
  update(
    previousStatus: RelationshipRecord["status"],
    record: RelationshipRecord,
    event: RelationshipEventDraft,
  ): Promise<RelationshipRecord>;
  registerReopening(
    relationshipId: string,
    event: RelationshipEventDraft,
  ): Promise<RelationshipEvent>;
}
