import type { RuntimeEvent } from "./types";

// Log de eventos interno do runtime (WP3: "RuntimeEvents somente
// internos") — append-only, cada evento congelado ao entrar, snapshot
// sempre uma cópia congelada. Não é exportado pelo index do módulo:
// nenhum consumidor externo assina eventos; o listener opcional existe
// só para integração interna (ex.: testes/bootstrap) e nunca pode
// corromper o estado do runtime — exceções dele são engolidas de
// propósito para preservar a consistência do ciclo de vida.
export class RuntimeEventLog {
  private readonly events: RuntimeEvent[] = [];
  private readonly listener?: (event: RuntimeEvent) => void;

  constructor(listener?: (event: RuntimeEvent) => void) {
    this.listener = listener;
  }

  record(event: RuntimeEvent): void {
    const frozen = Object.freeze(event);
    this.events.push(frozen);
    if (this.listener) {
      try {
        this.listener(frozen);
      } catch {
        // Listener nunca derruba o runtime — invariante de consistência.
      }
    }
  }

  snapshot(): readonly RuntimeEvent[] {
    return Object.freeze([...this.events]);
  }
}
