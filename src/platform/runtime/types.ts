// Contratos do ciclo de vida do Runtime (WP3 — EPIC-PLATFORM-02).
// Camada de plataforma: puramente técnica, nunca importa modules/* nem
// conhece HTTP/framework/SO — só orquestra dependências abstratas.

export type RuntimeState =
  "CREATED" | "INITIALIZING" | "READY" | "STOPPING" | "STOPPED" | "FAILED";

// Uma dependência gerenciada pelo runtime: nome estável + start/stop
// assíncronos ou síncronos. O runtime nunca conhece o que ela faz.
export type RuntimeDependency = {
  readonly name: string;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
};

// Falha registrada durante shutdown/rollback — nunca interrompe o
// encerramento das demais dependências (regra do WP3).
export type ShutdownFailure = {
  readonly dependency: string;
  readonly error: unknown;
};

// Resultado final de um shutdown: estado sempre conhecido, falhas
// agregadas em vez de propagadas uma a uma.
export type ShutdownReport = {
  readonly stopped: readonly string[];
  readonly failures: readonly ShutdownFailure[];
};

// Política de shutdown: decide apenas a ORDEM de encerramento.
// A continuidade após falha não é configurável — é invariante do WP3
// ("falha de uma dependência não impede encerramento das demais").
export type ShutdownPolicy = {
  readonly name: string;
  planOrder(started: readonly string[]): readonly string[];
};

// Eventos internos do runtime (WP3: "somente internos") — registrados em
// um log append-only imutável; nenhum barramento externo.
export type RuntimeEvent =
  | {
      readonly type: "STATE_CHANGED";
      readonly from: RuntimeState;
      readonly to: RuntimeState;
    }
  | { readonly type: "DEPENDENCY_STARTED"; readonly dependency: string }
  | { readonly type: "DEPENDENCY_STOPPED"; readonly dependency: string }
  | {
      readonly type: "DEPENDENCY_FAILED";
      readonly dependency: string;
      readonly phase: "start" | "stop" | "rollback";
      readonly error: unknown;
    };

// Snapshot imutável do contexto do runtime — nunca expõe estado parcial:
// dependências só aparecem aqui depois de iniciadas com sucesso, e a
// lista volta a vazia em FAILED/STOPPED.
export type RuntimeContext = {
  readonly state: RuntimeState;
  readonly startedDependencies: readonly string[];
};
