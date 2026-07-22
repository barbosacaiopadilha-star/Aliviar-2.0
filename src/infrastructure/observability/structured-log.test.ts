import { describe, expect, it } from "vitest";
import {
  buildStructuredOperationLog,
  logStructuredOperation,
} from "@/infrastructure/observability/structured-log";
import {
  containsSensitiveData,
  sanitizeLogPayload,
} from "@/infrastructure/observability/sanitize-log-payload";

describe("structured logs", () => {
  it("sanitiza campos sensíveis", () => {
    const sanitized = sanitizeLogPayload({
      email: "paciente@example.com",
      password: "secret",
      conteudo_base64: "YWJj",
      jornadaId: "jornada-1",
    });

    expect(sanitized.email).toBe("[redacted]");
    expect(sanitized.password).toBe("[redacted]");
    expect(sanitized.conteudo_base64).toBe("[redacted]");
    expect(sanitized.jornadaId).toBe("jornada-1");
  });

  it("detecta dados sensíveis no payload", () => {
    expect(containsSensitiveData({ token: "abc" })).toBe(true);
    expect(containsSensitiveData({ jornadaId: "abc" })).toBe(false);
  });

  it("gera log estruturado com ids mascarados", () => {
    const log = buildStructuredOperationLog({
      correlationId: "corr-1",
      operationType: "UPLOAD",
      jornadaId: "2406a266-c27d-41a5-aa9a-ff991777f277",
      patientId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      durationMs: 12,
      result: "success",
    });

    expect(log.correlationId).toBe("corr-1");
    expect(log.jornadaId).toBe("2406…f277");
    expect(log.patientId).toBe("aaaa…eeee");
    expect(JSON.stringify(log)).not.toContain("paciente@");
  });

  it("não lança ao registrar log", () => {
    expect(() =>
      logStructuredOperation({
        correlationId: "corr-2",
        operationType: "LOGIN",
        durationMs: 1,
        result: "success",
      }),
    ).not.toThrow();
  });
});
