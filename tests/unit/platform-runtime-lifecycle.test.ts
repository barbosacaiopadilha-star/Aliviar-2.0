import { describe, expect, it } from "vitest";

import {
  RuntimeError,
  RuntimeLifecycle,
  isTerminalRuntimeState,
  isValidRuntimeTransition,
} from "@/platform/runtime";
import type { RuntimeDependency, ShutdownPolicy } from "@/platform/runtime";

type DepOptions = {
  failStart?: boolean;
  failStop?: boolean;
};

function makeDep(
  name: string,
  calls: string[],
  options: DepOptions = {},
): RuntimeDependency {
  return {
    name,
    async start() {
      await Promise.resolve();
      if (options.failStart) {
        throw new Error(`falha ao iniciar ${name}`);
      }
      calls.push(`start:${name}`);
    },
    async stop() {
      await Promise.resolve();
      if (options.failStop) {
        throw new Error(`falha ao parar ${name}`);
      }
      calls.push(`stop:${name}`);
    },
  };
}

describe("RuntimeLifecycle — bootstrap completo", () => {
  it("vai de CREATED a READY iniciando as dependências na ordem de registro", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
      makeDep("c", calls),
    ]);

    expect(runtime.state).toBe("CREATED");
    await runtime.start();

    expect(runtime.state).toBe("READY");
    expect(calls).toEqual(["start:a", "start:b", "start:c"]);
    expect(runtime.context().startedDependencies).toEqual(["a", "b", "c"]);
  });

  it("funciona com zero dependências", async () => {
    const runtime = new RuntimeLifecycle([]);
    await runtime.start();
    expect(runtime.state).toBe("READY");
    const report = await runtime.stop();
    expect(runtime.state).toBe("STOPPED");
    expect(report.stopped).toEqual([]);
    expect(report.failures).toEqual([]);
  });
});

describe("RuntimeLifecycle — shutdown completo", () => {
  it("para em ordem reversa e termina em STOPPED", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
      makeDep("c", calls),
    ]);

    await runtime.start();
    const report = await runtime.stop();

    expect(runtime.state).toBe("STOPPED");
    expect(calls).toEqual([
      "start:a",
      "start:b",
      "start:c",
      "stop:c",
      "stop:b",
      "stop:a",
    ]);
    expect(report.stopped).toEqual(["c", "b", "a"]);
    expect(report.failures).toEqual([]);
  });

  it("stop() antes de start() vai direto de CREATED a STOPPED", async () => {
    const runtime = new RuntimeLifecycle([makeDep("a", [])]);
    const report = await runtime.stop();

    expect(runtime.state).toBe("STOPPED");
    expect(report.stopped).toEqual([]);
    await expect(runtime.start()).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });
});

describe("RuntimeLifecycle — rollback", () => {
  it("falha no bootstrap para as já iniciadas em ordem reversa e termina em FAILED", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
      makeDep("c", calls, { failStart: true }),
    ]);

    await expect(runtime.start()).rejects.toMatchObject({
      code: "BOOTSTRAP_FAILED",
    });

    expect(runtime.state).toBe("FAILED");
    expect(calls).toEqual(["start:a", "start:b", "stop:b", "stop:a"]);
  });

  it("falha durante o rollback não impede o rollback das demais", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls, { failStop: true }),
      makeDep("c", calls, { failStart: true }),
    ]);

    await expect(runtime.start()).rejects.toMatchObject({
      code: "BOOTSTRAP_FAILED",
    });

    expect(runtime.state).toBe("FAILED");
    expect(calls).toEqual(["start:a", "start:b", "stop:a"]);
    const report = await runtime.stop();
    expect(report.stopped).toEqual(["a"]);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0]?.dependency).toBe("b");
  });
});

describe("RuntimeLifecycle — falhas no shutdown", () => {
  it("falha de uma dependência não impede o encerramento das demais", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls, { failStop: true }),
      makeDep("c", calls),
    ]);

    await runtime.start();
    const report = await runtime.stop();

    expect(runtime.state).toBe("STOPPED");
    expect(calls).toEqual([
      "start:a",
      "start:b",
      "start:c",
      "stop:c",
      "stop:a",
    ]);
    expect(report.stopped).toEqual(["c", "a"]);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0]?.dependency).toBe("b");
  });
});

describe("RuntimeLifecycle — idempotência", () => {
  it("stop() repetido devolve o mesmo relatório sem parar de novo", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([makeDep("a", calls)]);

    await runtime.start();
    const first = await runtime.stop();
    const second = await runtime.stop();

    expect(second).toBe(first);
    expect(calls.filter((call) => call === "stop:a")).toHaveLength(1);
  });

  it("start() repetido depois de READY compartilha o mesmo bootstrap", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([makeDep("a", calls)]);

    await runtime.start();
    await runtime.start();

    expect(calls).toEqual(["start:a"]);
    expect(runtime.state).toBe("READY");
  });

  it("stop() depois de FAILED é no-op e mantém FAILED", async () => {
    const runtime = new RuntimeLifecycle([
      makeDep("a", [], { failStart: true }),
    ]);
    await expect(runtime.start()).rejects.toMatchObject({
      code: "BOOTSTRAP_FAILED",
    });

    const report = await runtime.stop();
    expect(runtime.state).toBe("FAILED");
    expect(report.stopped).toEqual([]);
  });
});

describe("RuntimeLifecycle — concorrência", () => {
  it("start() simultâneo inicia cada dependência exatamente uma vez", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
    ]);

    await Promise.all([runtime.start(), runtime.start(), runtime.start()]);

    expect(calls).toEqual(["start:a", "start:b"]);
    expect(runtime.state).toBe("READY");
  });

  it("stop() simultâneo executa um único shutdown", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
    ]);

    await runtime.start();
    const [first, second] = await Promise.all([runtime.stop(), runtime.stop()]);

    expect(second).toBe(first);
    expect(calls).toEqual(["start:a", "start:b", "stop:b", "stop:a"]);
  });

  it("stop() durante INITIALIZING espera o bootstrap assentar antes de parar", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle([
      makeDep("a", calls),
      makeDep("b", calls),
    ]);

    const starting = runtime.start();
    const stopping = runtime.stop();
    await Promise.all([starting, stopping]);

    expect(runtime.state).toBe("STOPPED");
    expect(calls).toEqual(["start:a", "start:b", "stop:b", "stop:a"]);
  });
});

describe("RuntimeLifecycle — ordem das dependências", () => {
  it("respeita uma política de shutdown customizada válida", async () => {
    const calls: string[] = [];
    const sameOrder: ShutdownPolicy = {
      name: "same-order",
      planOrder(started) {
        return [...started];
      },
    };
    const runtime = new RuntimeLifecycle(
      [makeDep("a", calls), makeDep("b", calls)],
      {
        shutdownPolicy: sameOrder,
      },
    );

    await runtime.start();
    await runtime.stop();

    expect(calls).toEqual(["start:a", "start:b", "stop:a", "stop:b"]);
  });

  it("plano inválido falha antes de STOPPING e o runtime permanece READY", async () => {
    const broken: ShutdownPolicy = {
      name: "broken",
      planOrder() {
        return ["a"];
      },
    };
    const calls: string[] = [];
    const runtime = new RuntimeLifecycle(
      [makeDep("a", calls), makeDep("b", calls)],
      {
        shutdownPolicy: broken,
      },
    );

    await runtime.start();
    await expect(runtime.stop()).rejects.toMatchObject({
      code: "SHUTDOWN_PLAN_INVALID",
    });

    expect(runtime.state).toBe("READY");
    expect(calls).toEqual(["start:a", "start:b"]);
  });
});

describe("RuntimeLifecycle — transições de estado", () => {
  it("registra a sequência completa CREATED→INITIALIZING→READY→STOPPING→STOPPED", async () => {
    const runtime = new RuntimeLifecycle([makeDep("a", [])]);
    await runtime.start();
    await runtime.stop();

    const transitions = runtime
      .events()
      .filter((event) => event.type === "STATE_CHANGED")
      .map((event) =>
        event.type === "STATE_CHANGED" ? `${event.from}→${event.to}` : "",
      );

    expect(transitions).toEqual([
      "CREATED→INITIALIZING",
      "INITIALIZING→READY",
      "READY→STOPPING",
      "STOPPING→STOPPED",
    ]);
  });

  it("start() depois de STOPPED é transição inválida", async () => {
    const runtime = new RuntimeLifecycle([makeDep("a", [])]);
    await runtime.start();
    await runtime.stop();

    await expect(runtime.start()).rejects.toBeInstanceOf(RuntimeError);
    await expect(runtime.start()).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("a máquina de estados declara STOPPED e FAILED como terminais", () => {
    expect(isTerminalRuntimeState("STOPPED")).toBe(true);
    expect(isTerminalRuntimeState("FAILED")).toBe(true);
    expect(isTerminalRuntimeState("READY")).toBe(false);
    expect(isValidRuntimeTransition("READY", "STOPPING")).toBe(true);
    expect(isValidRuntimeTransition("STOPPED", "INITIALIZING")).toBe(false);
  });
});

describe("RuntimeLifecycle — imutabilidade", () => {
  it("context(), events() e o relatório de shutdown são congelados", async () => {
    const runtime = new RuntimeLifecycle([makeDep("a", [])]);
    await runtime.start();

    const context = runtime.context();
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.startedDependencies)).toBe(true);

    const events = runtime.events();
    expect(Object.isFrozen(events)).toBe(true);
    expect(events.every((event) => Object.isFrozen(event))).toBe(true);

    const report = await runtime.stop();
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.stopped)).toBe(true);
    expect(Object.isFrozen(report.failures)).toBe(true);
  });

  it("mutar o array de dependências original não afeta o runtime", async () => {
    const calls: string[] = [];
    const deps = [makeDep("a", calls)];
    const runtime = new RuntimeLifecycle(deps);

    deps.push(makeDep("intruso", calls));
    await runtime.start();

    expect(calls).toEqual(["start:a"]);
    expect(runtime.context().startedDependencies).toEqual(["a"]);
  });
});

describe("RuntimeLifecycle — ausência de estado parcial", () => {
  it("depois de um bootstrap falho, nenhuma dependência permanece exposta", async () => {
    const runtime = new RuntimeLifecycle([
      makeDep("a", []),
      makeDep("b", [], { failStart: true }),
    ]);

    await expect(runtime.start()).rejects.toMatchObject({
      code: "BOOTSTRAP_FAILED",
    });

    const context = runtime.context();
    expect(context.state).toBe("FAILED");
    expect(context.startedDependencies).toEqual([]);
  });

  it("depois do shutdown, o contexto volta a vazio mesmo com falhas individuais", async () => {
    const runtime = new RuntimeLifecycle([
      makeDep("a", []),
      makeDep("b", [], { failStop: true }),
    ]);

    await runtime.start();
    await runtime.stop();

    const context = runtime.context();
    expect(context.state).toBe("STOPPED");
    expect(context.startedDependencies).toEqual([]);
  });
});
