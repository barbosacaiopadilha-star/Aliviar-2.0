// Superfície pública do runtime da plataforma (WP3).
// RuntimeEventLog NÃO é exportado — eventos são somente internos.
export { RuntimeError } from "./errors";
export type { RuntimeErrorCode } from "./errors";
export { RuntimeBootstrap } from "./runtime-bootstrap";
export { RuntimeLifecycle } from "./runtime-lifecycle";
export { createReverseShutdownPolicy } from "./shutdown-policy";
export {
  allowedNextRuntimeStates,
  isTerminalRuntimeState,
  isValidRuntimeTransition,
} from "./state-machine";
export type {
  RuntimeContext,
  RuntimeDependency,
  RuntimeEvent,
  RuntimeState,
  ShutdownFailure,
  ShutdownPolicy,
  ShutdownReport,
} from "./types";
