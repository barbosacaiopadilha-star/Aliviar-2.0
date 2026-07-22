import { describe, expect, it } from "vitest";
import { ApiErrorCode } from "./api-error-code";
import { mapApplicationErrorToApiResponse } from "./application-error-mapper";

describe("application-error-mapper", () => {
  it("mapeia erro de validação para 400 com rastreabilidade", () => {
    const mapped = mapApplicationErrorToApiResponse({
      code: "VALIDATION_ERROR",
      message: "Campo inválido",
      fieldErrors: { full_name: "Obrigatório" },
    });

    expect(mapped.status).toBe(400);
    expect(mapped.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(mapped.body.error.domainCode).toBe("VALIDATION_ERROR");
    expect(mapped.body.error.traceId).toBeTruthy();
    expect(mapped.body.error.fieldErrors).toEqual({ full_name: "Obrigatório" });
  });

  it("mapeia erro de autorização para 401", () => {
    const mapped = mapApplicationErrorToApiResponse({
      code: "UNAUTHORIZED",
      message: "Perfil interno ativo obrigatório.",
    });

    expect(mapped.status).toBe(401);
    expect(mapped.body.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
  });

  it("mapeia regra de negócio para 422", () => {
    const mapped = mapApplicationErrorToApiResponse({
      code: "BUSINESS_RULE_VIOLATION",
      message: "Gestor inválido",
    });

    expect(mapped.status).toBe(422);
    expect(mapped.body.error.code).toBe(ApiErrorCode.BUSINESS_RULE_VIOLATION);
  });
});
