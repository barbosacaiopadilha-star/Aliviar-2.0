// Superfície pública do domínio Relationship (MVP — PR2 domínio puro +
// PR3 repository concreto). Nenhum outro módulo deve importar diretamente
// de relationship/commands.ts, relationship/types.ts etc. — apenas o que
// é reexportado aqui (mesma convenção já usada por connection/index.ts).

export {
  RELATIONSHIP_STATUSES,
  RELATIONSHIP_TERMINAL_STATUSES,
  RELATIONSHIP_EVENT_TYPES,
  RELATIONSHIP_TERMINATION_KINDS,
} from "./types";
export type {
  RelationshipStatus,
  RelationshipEventType,
  RelationshipTerminationKind,
  RelationshipAuthor,
  ReopeningReference,
  RelationshipRecord,
  RelationshipRecordDraft,
  RelationshipEvent,
  RelationshipEventDraft,
  CreateRelationshipResult,
  UpdateRelationshipResult,
  RegisterReopeningResult,
  RelationshipActionResult,
} from "./types";

export { RelationshipError } from "./errors";
export type { RelationshipErrorCode } from "./errors";

export {
  isValidRelationshipTransition,
  allowedNextRelationshipStatuses,
  isTerminalRelationshipStatus,
  canClose,
  canRegisterInterruption,
  canRegisterReopening,
} from "./state-machine";

export {
  createRelationship,
  closePlanned,
  registerInterruption,
  registerReopening,
} from "./commands";
export type {
  CreateRelationshipInput,
  ClosePlannedInput,
  RegisterInterruptionInput,
  RegisterReopeningInput,
} from "./commands";

export type { RelationshipRepository } from "./ports/relationship-repository";
export {
  SupabaseRelationshipRepository,
  reconstructRelationshipRecordFromRow,
} from "./repository";

// relationship/actions.ts ("use server") não é reexportado aqui — mesma
// convenção de connection/index.ts: Server Actions são importadas
// diretamente do seu próprio caminho por quem as consome (futura UI),
// nunca através do barrel de domínio. Nenhum cliente Supabase bruto,
// mapeador de linha, helper de RPC ou detalhe de RLS é exposto — apenas a
// classe do repository concreto, no mesmo nível de abstração já usado por
// SupabaseConnectionRepository.
