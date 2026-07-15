// Superfície pública do domínio Connection (MVP). Nenhum outro módulo deve
// importar diretamente de connection/commands.ts, connection/types.ts etc.
// — apenas o que é reexportado aqui (Technical Architecture Specification,
// Etapa 3: interfaces públicas de módulo).

export {
  CONNECTION_STATUSES,
  CONNECTION_EVENT_TYPES,
  RELATIONSHIP_BIRTH_STATUS,
} from "./types";
export type {
  ConnectionStatus,
  ConnectionEventType,
  ConnectionRecord,
  ConnectionRecordDraft,
  ConnectionEvent,
  ConnectionEventDraft,
  CreateConnectionResult,
  UpdateConnectionResult,
  ConnectionActionResult,
} from "./types";

export { ConnectionError } from "./errors";
export type { ConnectionErrorCode } from "./errors";

export {
  isValidConnectionTransition,
  allowedNextConnectionStatuses,
  isTerminalConnectionStatus,
} from "./state-machine";

export {
  createConnection,
  correctChoice,
  registerContactIntent,
  confirmFirstAppointment,
  closeWithoutRelationship,
} from "./commands";
export type {
  EligibilityContext,
  CreateConnectionInput,
  CorrectChoiceInput,
  RegisterContactIntentInput,
  ConfirmFirstAppointmentInput,
  CloseWithoutRelationshipInput,
} from "./commands";

export type { ConnectionRepository } from "./ports/connection-repository";
export { SupabaseConnectionRepository } from "./repository";

// connection/actions.ts ("use server") não é reexportado aqui — mesma
// convenção de concierge/human-review-actions.ts: Server Actions são
// importadas diretamente do seu próprio caminho por quem as consome
// (futura UI), nunca através do barrel de domínio.
