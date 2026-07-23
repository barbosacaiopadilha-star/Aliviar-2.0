export type { PrimeiroPortalView } from "./model/primeiro-portal-view";
export type { CompartilharContextoView } from "./model/compartilhar-contexto-view";
export type { CuradoriaContextoView } from "./model/curadoria-contexto-view";
export type { HistoriaRecebidaView } from "./model/historia-recebida-view";
export type {
  SharePatientContextInput,
  SharePatientContextResult,
} from "./model/share-context-input";
export {
  OPERATIONAL_STAGE_LABELS,
  PUBLIC_CHAPTER_LABELS,
  HISTORIA_RECEBIDA_COPY,
  STORY_RECEPTION_PORTAL_TITLE,
  STORY_RECEPTION_CURADORIA_TITLE,
} from "./labels";
export {
  createVerticalSliceStack,
  registerPatientInStack,
  registerJourneyInCatalog,
  signInPatient,
} from "./composition/vertical-slice-stack";
export type { VerticalSliceStack } from "./composition/vertical-slice-stack";
export { HandoffCaseBootstrapAdapter } from "./adapters/handoff-case-bootstrap-adapter";
export { buildPrimeiroPortalView } from "./services/build-primeiro-portal-view";
export type {
  BuildPrimeiroPortalViewInput,
  BuildPrimeiroPortalViewResult,
} from "./services/build-primeiro-portal-view";
export { runPublicToPortalFlow } from "./services/run-public-to-portal-flow";
export type {
  PublicToPortalFlowInput,
  PublicToPortalFlowResult,
} from "./services/run-public-to-portal-flow";
export {
  seedDemoPortalSession,
  getDemoPortalSession,
  clearDemoPortalSessions,
} from "./infrastructure/demo-portal-store";
export { PatientSharingMemoryAccess } from "./infrastructure/patient-sharing-memory-access";
export { buildCompartilharContextoView } from "./services/build-compartilhar-contexto-view";
export { buildCuradoriaContextoView } from "./services/build-curadoria-contexto-view";
export { buildHistoriaRecebidaView } from "./services/build-historia-recebida-view";
export { confirmHistoriaRecebida } from "./services/confirm-historia-recebida";
export { sharePatientContext } from "./services/share-patient-context";
export {
  organizeSharedContext,
  buildContextHistory,
  hasStoryReceptionConfirmed,
  hasNovoContextoParaCuradoria,
} from "./services/context-projection-helpers";
export { getDemoApiRuntime, resetDemoApiRuntime, DEMO_USER_ID } from "./infrastructure/demo-api-runtime";
