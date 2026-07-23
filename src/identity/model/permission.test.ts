import { describe, expect, it } from "vitest";

import { permissionsForRole, platformRoleHasPermission } from "./permission";

describe("platform permissions", () => {
  it("AUDITOR tem leitura mas n├úo escrita", () => {
    expect(platformRoleHasPermission("AUDITOR", "journey.read")).toBe(true);
    expect(platformRoleHasPermission("AUDITOR", "audit.read")).toBe(true);
    expect(platformRoleHasPermission("AUDITOR", "journey.create")).toBe(false);
    expect(platformRoleHasPermission("AUDITOR", "delivery.publish")).toBe(false);
  });

  it("PATIENT pode ler documentos da pr├│pria jornada", () => {
    expect(platformRoleHasPermission("PATIENT", "documents.read")).toBe(true);
    expect(platformRoleHasPermission("PATIENT", "documents.write")).toBe(true);
    expect(platformRoleHasPermission("PATIENT", "curator.assign")).toBe(false);
  });

  it("ADMIN possui admin.manage", () => {
    expect(platformRoleHasPermission("ADMIN", "admin.manage")).toBe(true);
    expect(platformRoleHasPermission("MANAGER", "admin.manage")).toBe(false);
  });

  it("permissionsForRole retorna lista coerente", () => {
    const curator = permissionsForRole("CURATOR");
    expect(curator).toContain("delivery.publish");
    expect(curator).not.toContain("admin.manage");
  });
});
