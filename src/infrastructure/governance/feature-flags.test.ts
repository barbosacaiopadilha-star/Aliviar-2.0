import { describe, expect, it } from "vitest";
import { PERMISSION_MATRIX } from "@/governance-flow/contracts/rbac";

describe("feature flags contracts", () => {
  it("mantém chaves de permissão para flags administrativas", () => {
    expect(PERMISSION_MATRIX["admin.flags.read"]).toContain("ADMIN");
    expect(PERMISSION_MATRIX["admin.flags.write"]).toEqual(["ADMIN"]);
  });
});
