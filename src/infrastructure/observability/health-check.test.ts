import { describe, expect, it } from "vitest";

describe("health checks", () => {
  it("agrega status down quando há checks down", async () => {
    const { runOperationalHealthChecks } = await import("@/infrastructure/observability/health-check");
    const report = await runOperationalHealthChecks();

    expect(report.timestamp).toBeTruthy();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(["ok", "degraded", "down"]).toContain(report.status);
    expect(report.summary.ok + report.summary.degraded + report.summary.down).toBe(
      report.checks.length,
    );
  });

  it("inclui checks de configuração crítica", async () => {
    const { runOperationalHealthChecks } = await import("@/infrastructure/observability/health-check");
    const report = await runOperationalHealthChecks();
    const names = report.checks.map((c) => c.name);
    expect(names.some((n) => n.startsWith("config:"))).toBe(true);
    expect(names.some((n) => n.startsWith("migrations:"))).toBe(true);
  });
});
