import { describe, expect, it } from "vitest";
import {
  buildPermissionMatrixView,
  governanceRoleHasPermission,
  mapUserRoleToGovernance,
} from "@/lib/auth/rbac";
import { PERMISSION_MATRIX } from "@/governance-flow/contracts/rbac";

describe("RBAC centralizado", () => {
  it("mapeia papéis internos para governança", () => {
    expect(mapUserRoleToGovernance("ADMIN")).toBe("ADMIN");
    expect(mapUserRoleToGovernance("CURATOR")).toBe("CURADOR");
    expect(mapUserRoleToGovernance("OPERATION")).toBe("OPERADOR");
    expect(mapUserRoleToGovernance("AUDITOR")).toBe("AUDITOR");
    expect(mapUserRoleToGovernance("MANAGER")).toBe("OPERADOR");
  });

  it("autoriza admin para escrita de configuração", () => {
    expect(governanceRoleHasPermission("ADMIN", "admin.config.write")).toBe(true);
    expect(governanceRoleHasPermission("AUDITOR", "admin.config.write")).toBe(false);
  });

  it("autoriza auditor para leitura de auditoria", () => {
    expect(governanceRoleHasPermission("AUDITOR", "admin.audit.read")).toBe(true);
    expect(governanceRoleHasPermission("CURADOR", "admin.audit.read")).toBe(false);
  });

  it("expõe matriz de permissões completa", () => {
    const matrix = buildPermissionMatrixView();
    expect(matrix.permissions.length).toBe(Object.keys(PERMISSION_MATRIX).length);
  });
});
