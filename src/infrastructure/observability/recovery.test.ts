import { describe, expect, it } from "vitest";
import {
  getRecoveryProcedure,
  RECOVERY_PROCEDURES,
  shouldRetryOperation,
} from "@/infrastructure/observability/recovery";

describe("recovery procedures", () => {
  it("define procedimentos para todos os cenários", () => {
    const cenarios = RECOVERY_PROCEDURES.map((p) => p.cenario);
    expect(cenarios).toEqual([
      "UPLOAD_FAILURE",
      "PUBLICATION_FAILURE",
      "AUTH_FAILURE",
      "DATABASE_UNAVAILABLE",
    ]);
  });

  it("retorna passos ordenados por cenário", () => {
    const proc = getRecoveryProcedure("UPLOAD_FAILURE");
    expect(proc.passos[0]?.ordem).toBe(1);
    expect(proc.preservar_consistencia.length).toBeGreaterThan(0);
  });

  it("limita retries conforme cenário", () => {
    expect(shouldRetryOperation({ cenario: "AUTH_FAILURE", attempts: 1, maxAttempts: 3 })).toBe(
      true,
    );
    expect(
      shouldRetryOperation({ cenario: "UPLOAD_FAILURE", attempts: 1, maxAttempts: 3 }),
    ).toBe(false);
    expect(shouldRetryOperation({ cenario: "AUTH_FAILURE", attempts: 3, maxAttempts: 3 })).toBe(
      false,
    );
  });
});
