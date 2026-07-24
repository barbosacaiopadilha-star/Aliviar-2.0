import type { AuthState } from "./session";

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  curador_medico: "Curador Médico",
  concierge: "Concierge",
  paciente: "Paciente",
  profissional: "Profissional",
};

/**
 * Nome seguro para exibição — nunca usa mocks ou fallbacks fictícios.
 * Prioridade: display_name → e-mail → rótulo do papel principal.
 */
export function resolveAuthenticatedDisplayName(state: AuthState): string {
  const fromProfile = state.profile?.displayName?.trim();
  if (fromProfile) return fromProfile;

  const email = state.user.email?.trim();
  if (email) return email;

  return resolvePrimaryRoleLabel(state.roles);
}

export function resolvePrimaryRoleLabel(roles: string[]): string {
  const priority = ["administrador", "curador_medico", "concierge", "profissional", "paciente"];
  for (const role of priority) {
    if (roles.includes(role)) {
      return ROLE_LABELS[role] ?? role;
    }
  }
  return "Usuário";
}

export function resolveGreetingFirstName(state: AuthState): string {
  const fromProfile = state.profile?.displayName?.trim();
  if (fromProfile) {
    return fromProfile.split(/\s+/)[0] ?? fromProfile;
  }
  return resolvePrimaryRoleLabel(state.roles);
}
