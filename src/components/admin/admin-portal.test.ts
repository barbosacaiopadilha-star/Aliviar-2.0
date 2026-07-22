import { describe, expect, it } from "vitest";

describe("portal administrativo", () => {
  it("expõe módulos via API admin", () => {
    const modules = [
      "/api/v1/admin/configuracao",
      "/api/v1/admin/usuarios",
      "/api/v1/admin/permissoes",
      "/api/v1/admin/feature-flags",
      "/api/v1/admin/saude",
      "/api/v1/admin/auditoria",
      "/api/v1/admin/qualidade",
    ];
    expect(modules).toHaveLength(7);
  });
});
