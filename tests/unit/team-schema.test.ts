import { describe, expect, it } from "vitest";

import { teamRoleActionSchema } from "@/modules/team/schema";

describe("teamRoleActionSchema", () => {
  it("aceita administrador e curador_medico", () => {
    expect(
      teamRoleActionSchema.safeParse({
        profileId: "123e4567-e89b-12d3-a456-426614174000",
        roleSlug: "administrador",
      }).success,
    ).toBe(true);

    expect(
      teamRoleActionSchema.safeParse({
        profileId: "123e4567-e89b-12d3-a456-426614174000",
        roleSlug: "curador_medico",
      }).success,
    ).toBe(true);
  });

  it("nunca aceita paciente ou profissional como papel concedível por aqui", () => {
    expect(
      teamRoleActionSchema.safeParse({
        profileId: "123e4567-e89b-12d3-a456-426614174000",
        roleSlug: "paciente",
      }).success,
    ).toBe(false);

    expect(
      teamRoleActionSchema.safeParse({
        profileId: "123e4567-e89b-12d3-a456-426614174000",
        roleSlug: "profissional",
      }).success,
    ).toBe(false);
  });

  it("rejeita profileId que não é uuid", () => {
    expect(
      teamRoleActionSchema.safeParse({ profileId: "not-a-uuid", roleSlug: "administrador" }).success,
    ).toBe(false);
  });

  it("rejeita papel desconhecido", () => {
    expect(
      teamRoleActionSchema.safeParse({
        profileId: "123e4567-e89b-12d3-a456-426614174000",
        roleSlug: "inventado",
      }).success,
    ).toBe(false);
  });
});
