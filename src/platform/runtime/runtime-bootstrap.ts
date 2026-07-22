import { RuntimeError } from "./errors";
import { RuntimeLifecycle } from "./runtime-lifecycle";
import type { RuntimeDependency, RuntimeEvent, ShutdownPolicy } from "./types";

type BuildOptions = {
  shutdownPolicy?: ShutdownPolicy;
  onEvent?: (event: RuntimeEvent) => void;
};

// Composição do runtime (WP3): o RuntimeBootstrap registra dependências
// em ordem explícita e entrega um RuntimeLifecycle pronto. Depois de
// build(), o registro é selado — nenhuma dependência entra ou sai de um
// runtime já materializado (imutabilidade do conjunto de dependências).
export class RuntimeBootstrap {
  private readonly dependencies: RuntimeDependency[] = [];
  private sealed = false;

  register(dependency: RuntimeDependency): this {
    if (this.sealed) {
      throw new RuntimeError({
        code: "BOOTSTRAP_SEALED",
        message: "O RuntimeBootstrap já produziu um runtime — registro selado.",
      });
    }
    if (
      this.dependencies.some((existing) => existing.name === dependency.name)
    ) {
      throw new RuntimeError({
        code: "DUPLICATE_DEPENDENCY",
        message: `Dependência duplicada: "${dependency.name}".`,
      });
    }
    this.dependencies.push(dependency);
    return this;
  }

  build(options: BuildOptions = {}): RuntimeLifecycle {
    if (this.sealed) {
      // Dono único do ciclo de vida: um segundo build() criaria um segundo
      // runtime sobre as MESMAS instâncias de dependência (dois start()
      // sobre o mesmo recurso). Falha determinística, nunca clonagem.
      throw new RuntimeError({
        code: "BOOTSTRAP_SEALED",
        message:
          "O RuntimeBootstrap já materializou um runtime — build() é único.",
      });
    }
    this.sealed = true;
    return new RuntimeLifecycle(this.dependencies, options);
  }
}
