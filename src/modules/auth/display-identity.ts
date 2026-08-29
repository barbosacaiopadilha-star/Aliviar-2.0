import type { AuthState } from "./session";

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  // Polimento 2026-07-24: `atendente` faltava aqui — um Atendente logado era
  // rotulado "Usuário", com o papel real disponível na sessão.
  atendente: "Supervisor",
  curador_medico: "Curador Médico",
  concierge: "Concierge",
  // 27/08 · O SLUG FICA, O NOME MUDA. `paciente` é papel em `user_roles`,
  // RLS e capabilities — dado, nunca texto. O que se LÊ passa a ser
  // "Assistido" (ADR-097). A palavra clínica "paciente" permanece onde ela
  // é do médico: os pacientes DELE, na entrevista do profissional.
  paciente: "Assistido",
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
  const priority = ["administrador", "atendente", "curador_medico", "concierge", "profissional", "paciente"];
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
