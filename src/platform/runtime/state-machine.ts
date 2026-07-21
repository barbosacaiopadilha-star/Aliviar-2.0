import type { RuntimeState } from "./types";

// Máquina de estados do runtime (WP3):
// CREATED → INITIALIZING → READY → STOPPING → STOPPED, com FAILED como
// terminal de bootstrap. CREATED → STOPPED cobre o stop() antes de
// qualquer start(): nada foi iniciado, o estado final é conhecido sem
// passar por STOPPING. Mesmo idioma de connection/state-machine.ts.
const ALLOWED_TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  CREATED: ["INITIALIZING", "STOPPED"],
  INITIALIZING: ["READY", "FAILED"],
  READY: ["STOPPING"],
  STOPPING: ["STOPPED"],
  STOPPED: [],
  FAILED: [],
};

export function isValidRuntimeTransition(
  from: RuntimeState,
  to: RuntimeState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedNextRuntimeStates(from: RuntimeState): RuntimeState[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isTerminalRuntimeState(state: RuntimeState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}
