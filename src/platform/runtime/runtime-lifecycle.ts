import { RuntimeError } from "./errors";
import { RuntimeEventLog } from "./runtime-events";
import {
  assertValidShutdownPlan,
  createReverseShutdownPolicy,
} from "./shutdown-policy";
import { isValidRuntimeTransition } from "./state-machine";
import type {
  RuntimeContext,
  RuntimeDependency,
  RuntimeEvent,
  RuntimeState,
  ShutdownFailure,
  ShutdownPolicy,
  ShutdownReport,
} from "./types";

type RuntimeLifecycleOptions = {
  shutdownPolicy?: ShutdownPolicy;
  // Integração interna (bootstrap/testes) — nunca um barramento público.
  onEvent?: (event: RuntimeEvent) => void;
};

// Ciclo de vida do Runtime (WP3 — EPIC-PLATFORM-02).
//
// Invariantes:
// - toda mudança de estado passa pela máquina de estados (state-machine.ts);
// - bootstrap com rollback: falha ao iniciar a N-ésima dependência para as
//   N-1 anteriores em ordem reversa e termina em FAILED — nunca sobra
//   estado parcial observável;
// - shutdown idempotente e concorrência-seguro: chamadas simultâneas ou
//   repetidas de start()/stop() compartilham a mesma promessa em vez de
//   duplicar efeitos;
// - falha de uma dependência no shutdown nunca impede o encerramento das
//   demais — falhas são agregadas no ShutdownReport;
// - o estado final é sempre conhecido: STOPPED ou FAILED, ambos terminais.
export class RuntimeLifecycle {
  private currentState: RuntimeState = "CREATED";
  private readonly dependencies: readonly RuntimeDependency[];
  private readonly shutdownPolicy: ShutdownPolicy;
  private readonly eventLog: RuntimeEventLog;
  private readonly started: string[] = [];
  private startPromise?: Promise<void>;
  private stopPromise?: Promise<ShutdownReport>;
  private finalReport?: ShutdownReport;

  constructor(
    dependencies: readonly RuntimeDependency[],
    options: RuntimeLifecycleOptions = {},
  ) {
    // Cópia congelada: mutações externas do array original nunca alcançam
    // o runtime (imutabilidade exigida pelo WP3).
    this.dependencies = Object.freeze([...dependencies]);
    this.shutdownPolicy =
      options.shutdownPolicy ?? createReverseShutdownPolicy();
    this.eventLog = new RuntimeEventLog(options.onEvent);
  }

  get state(): RuntimeState {
    return this.currentState;
  }

  // Snapshot imutável — nunca expõe dependência que não tenha concluído o
  // próprio start(), e volta a vazio em FAILED/STOPPED (ausência de
  // estado parcial).
  context(): RuntimeContext {
    return Object.freeze({
      state: this.currentState,
      startedDependencies: Object.freeze([...this.started]),
    });
  }

  events(): readonly RuntimeEvent[] {
    return this.eventLog.snapshot();
  }

  start(): Promise<void> {
    if (
      this.startPromise &&
      (this.currentState === "INITIALIZING" || this.currentState === "READY")
    ) {
      // Concorrência: start() simultâneo/repetido compartilha o mesmo
      // bootstrap — cada dependência inicia exatamente uma vez.
      return this.startPromise;
    }
    if (this.currentState !== "CREATED") {
      // STOPPING/STOPPED/FAILED: um runtime nunca renasce — estado final
      // sempre conhecido, sem reinicialização implícita.
      return Promise.reject(
        new RuntimeError({
          code: "INVALID_TRANSITION",
          message: `start() não é permitido no estado ${this.currentState}.`,
        }),
      );
    }
    this.startPromise = this.runBootstrap();
    return this.startPromise;
  }

  stop(): Promise<ShutdownReport> {
    if (this.stopPromise) {
      // Idempotência: o mesmo shutdown (e o mesmo relatório) para todas
      // as chamadas, simultâneas ou tardias.
      return this.stopPromise;
    }
    this.stopPromise = this.runStop();
    return this.stopPromise;
  }

  private transitionTo(next: RuntimeState): void {
    if (!isValidRuntimeTransition(this.currentState, next)) {
      throw new RuntimeError({
        code: "INVALID_TRANSITION",
        message: `Transição inválida: ${this.currentState} → ${next}.`,
      });
    }
    const from = this.currentState;
    this.currentState = next;
    this.eventLog.record({ type: "STATE_CHANGED", from, to: next });
  }

  private async runBootstrap(): Promise<void> {
    this.transitionTo("INITIALIZING");

    for (const dependency of this.dependencies) {
      try {
        await dependency.start();
        this.started.push(dependency.name);
        this.eventLog.record({
          type: "DEPENDENCY_STARTED",
          dependency: dependency.name,
        });
      } catch (error) {
        this.eventLog.record({
          type: "DEPENDENCY_FAILED",
          dependency: dependency.name,
          phase: "start",
          error,
        });
        this.finalReport = await this.rollback();
        this.transitionTo("FAILED");
        throw new RuntimeError({
          code: "BOOTSTRAP_FAILED",
          message: `Bootstrap falhou ao iniciar "${dependency.name}"; rollback concluído, runtime em FAILED.`,
        });
      }
    }

    this.transitionTo("READY");
  }

  // Rollback do bootstrap: para as dependências já iniciadas em ordem
  // reversa, sem interromper nas falhas — mesmo contrato do shutdown.
  private async rollback(): Promise<ShutdownReport> {
    const plan = [...this.started].reverse();
    return this.stopByPlan(plan, "rollback");
  }

  private async runStop(): Promise<ShutdownReport> {
    if (this.startPromise) {
      // stop() durante INITIALIZING espera o bootstrap assentar (READY ou
      // FAILED) — nunca encerra uma inicialização pela metade.
      await this.startPromise.catch(() => undefined);
    }

    if (this.currentState === "FAILED") {
      // Idempotência pós-rollback: o relatório do rollback é o resultado
      // final conhecido; nada mais há para parar.
      return (
        this.finalReport ??
        Object.freeze({
          stopped: Object.freeze([]),
          failures: Object.freeze([]),
        })
      );
    }

    if (this.currentState === "CREATED") {
      // Nada foi iniciado: estado final conhecido sem passar por STOPPING.
      this.transitionTo("STOPPED");
      this.finalReport = Object.freeze({
        stopped: Object.freeze([]),
        failures: Object.freeze([]),
      });
      return this.finalReport;
    }

    // Aqui o estado é READY (INITIALIZING já assentou acima; STOPPING/
    // STOPPED são inalcançáveis porque stopPromise é única).
    const plan = this.shutdownPolicy.planOrder([...this.started]);
    assertValidShutdownPlan(this.shutdownPolicy.name, this.started, plan);

    this.transitionTo("STOPPING");
    this.finalReport = await this.stopByPlan(plan, "stop");
    this.transitionTo("STOPPED");
    return this.finalReport;
  }

  private async stopByPlan(
    plan: readonly string[],
    phase: "stop" | "rollback",
  ): Promise<ShutdownReport> {
    const stopped: string[] = [];
    const failures: ShutdownFailure[] = [];

    for (const name of plan) {
      const dependency = this.dependencies.find(
        (candidate) => candidate.name === name,
      );
      if (!dependency) {
        continue;
      }
      try {
        await dependency.stop();
        stopped.push(name);
        this.eventLog.record({ type: "DEPENDENCY_STOPPED", dependency: name });
      } catch (error) {
        failures.push({ dependency: name, error });
        this.eventLog.record({
          type: "DEPENDENCY_FAILED",
          dependency: name,
          phase,
          error,
        });
      }
    }

    // Consistência do contexto: encerrado (com ou sem falha individual),
    // nenhuma dependência permanece exposta como "iniciada".
    this.started.length = 0;

    return Object.freeze({
      stopped: Object.freeze(stopped),
      failures: Object.freeze(failures),
    });
  }
}
