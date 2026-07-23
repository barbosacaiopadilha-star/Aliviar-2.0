// Model
export type { DeliveryStatus } from "./model/delivery-status";
export { DELIVERY_STATUSES, isDeliveryStatus } from "./model/delivery-status";

export type { DeliveryAccess, DeliveryAccessType } from "./model/delivery-access";
export { DELIVERY_ACCESS_TYPES } from "./model/delivery-access";

export type { DeliveryVersion } from "./model/delivery-version";

export type { DeliveryAuditEntry, DeliveryAuditAction } from "./model/delivery-audit-entry";
export { DELIVERY_AUDIT_ACTIONS } from "./model/delivery-audit-entry";

export type { ReportDeliverySnapshot } from "./model/report-delivery";
export { DeliveryAggregate } from "./model/report-delivery";

// State machine
export {
  canTransitionDeliveryStatus,
  assertDeliveryStatusTransition,
  isDeliveryActive,
  isDeliveryAccessible,
} from "./state-machine/delivery-status-machine";

// Ports
export type {
  ClockPort,
  IdGeneratorPort,
  ReportDeliveryContextRecord,
  ReportLookupPort,
  DeliveryRepositoryPort,
  DeliveryAccessRepositoryPort,
  DeliveryVersionRepositoryPort,
} from "./ports/report-delivery-ports";

// Services
export { createDelivery } from "./services/create-delivery";
export type { CreateDeliveryInput } from "./services/create-delivery";

export { publishDelivery } from "./services/publish-delivery";
export type { PublishDeliveryInput } from "./services/publish-delivery";

export { registerFirstView } from "./services/register-first-view";
export type { RegisterFirstViewInput, RegisterFirstViewResult } from "./services/register-first-view";

export { registerReadConfirmation } from "./services/register-read-confirmation";
export type {
  RegisterReadConfirmationInput,
  RegisterReadConfirmationResult,
} from "./services/register-read-confirmation";

export { reopenDelivery } from "./services/reopen-delivery";
export type { ReopenDeliveryInput, ReopenDeliveryResult } from "./services/reopen-delivery";

export { archiveDelivery } from "./services/archive-delivery";
export type { ArchiveDeliveryInput } from "./services/archive-delivery";

// Infrastructure
export {
  InMemoryDeliveryRepository,
  InMemoryDeliveryAccessRepository,
  InMemoryDeliveryVersionRepository,
  InMemoryReportLookup,
} from "./infrastructure/in-memory-repositories";
