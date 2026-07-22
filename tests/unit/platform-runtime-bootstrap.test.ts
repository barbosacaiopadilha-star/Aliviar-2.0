import { describe, expect, it } from "vitest";

import { RuntimeBootstrap } from "@/platform/runtime";
import type { RuntimeDependency } from "@/platform/runtime";

function makeDep(name: string, calls: string[]): RuntimeDependency {
  return {
    name,
    start() {
      calls.push(`start:${name}`);
    },
    stop() {
      calls.push(`stop:${name}`);
    },
  };
}

describe("RuntimeBootstrap", () => {
  it("compõe um RuntimeLifecycle que inicia e para na ordem registrada", async () => {
    const calls: string[] = [];
    const runtime = new RuntimeBootstrap()
      .register(makeDep("config", calls))
      .register(makeDep("health", calls))
      .register(makeDep("observability", calls))
      .build();

    await runtime.start();
    expect(runtime.state).toBe("READY");

    await runtime.stop();
    expect(runtime.state).toBe("STOPPED");
    expect(calls).toEqual([
      "start:config",
      "start:health",
      "start:observability",
      "stop:observability",
      "stop:health",
      "stop:config",
    ]);
  });

  it("rejeita dependência com nome duplicado", () => {
    const bootstrap = new RuntimeBootstrap().register(makeDep("config", []));
    let error: unknown;
    try {
      bootstrap.register(makeDep("config", []));
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toMatchObject({ code: "DUPLICATE_DEPENDENCY" });
  });

  it("sela o registro depois de build()", () => {
    const bootstrap = new RuntimeBootstrap().register(makeDep("config", []));
    bootstrap.build();
    let error: unknown;
    try {
      bootstrap.register(makeDep("health", []));
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toMatchObject({ code: "BOOTSTRAP_SEALED" });
  });

  it("build() é único: a segunda chamada falha e nenhuma dependência inicia duas vezes", async () => {
    const calls: string[] = [];
    const bootstrap = new RuntimeBootstrap().register(makeDep("config", calls));

    const runtime = bootstrap.build();
    await runtime.start();

    let error: unknown;
    try {
      bootstrap.build();
    } catch (thrown) {
      error = thrown;
    }

    expect(error).toMatchObject({ code: "BOOTSTRAP_SEALED" });
    expect(calls).toEqual(["start:config"]);
    expect(runtime.state).toBe("READY");
  });

  it("propaga o listener interno de eventos ao runtime", async () => {
    const seen: string[] = [];
    const runtime = new RuntimeBootstrap()
      .register(makeDep("config", []))
      .build({ onEvent: (event) => seen.push(event.type) });

    await runtime.start();
    await runtime.stop();

    expect(seen).toEqual([
      "STATE_CHANGED",
      "DEPENDENCY_STARTED",
      "STATE_CHANGED",
      "STATE_CHANGED",
      "DEPENDENCY_STOPPED",
      "STATE_CHANGED",
    ]);
  });

  it("um listener que lança exceção nunca corrompe o ciclo de vida", async () => {
    const runtime = new RuntimeBootstrap()
      .register(makeDep("config", []))
      .build({
        onEvent: () => {
          throw new Error("listener quebrado");
        },
      });

    await runtime.start();
    const report = await runtime.stop();

    expect(runtime.state).toBe("STOPPED");
    expect(report.failures).toEqual([]);
  });
});
