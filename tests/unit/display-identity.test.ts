import { describe, expect, it } from "vitest";

import type { User } from "@supabase/supabase-js";

import {
  resolveAuthenticatedDisplayName,
  resolveGreetingFirstName,
  resolvePrimaryRoleLabel,
} from "@/modules/auth/display-identity";
import type { AuthState } from "@/modules/auth/session";

function authState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user: { id: "u1", email: "admin@aliviar.com" } as User,
    profile: null,
    roles: ["administrador"],
    ...overrides,
  };
}

describe("Identidade autenticada — header do portal", () => {
  it("usa display_name do perfil quando disponível", () => {
    const state = authState({
      profile: { displayName: "João Silva", id: "u1", avatarUrl: null },
    });
    expect(resolveAuthenticatedDisplayName(state)).toBe("João Silva");
    expect(resolveGreetingFirstName(state)).toBe("João");
  });

  it("usa e-mail quando não há display_name", () => {
    const state = authState({ profile: null });
    expect(resolveAuthenticatedDisplayName(state)).toBe("admin@aliviar.com");
  });

  it("nunca retorna nome fictício de mock", () => {
    const state = authState({ profile: null, user: { id: "u1", email: "" } as User });
    expect(resolveAuthenticatedDisplayName(state)).not.toBe("Helena Vasconcelos");
    expect(resolveAuthenticatedDisplayName(state)).toBe("Administrador");
  });

  it("resolve papel principal corretamente", () => {
    expect(resolvePrimaryRoleLabel(["curador_medico", "administrador"])).toBe("Administrador");
    expect(resolvePrimaryRoleLabel(["curador_medico"])).toBe("Curador Médico");
  });
});
