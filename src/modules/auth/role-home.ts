// Mapa interno e fixo (não input do usuário) de papel -> rota inicial.
// Usado tanto para o redirecionamento padrão pós-login (sem `next`) quanto
// para o link de volta em /acesso-negado — um único lugar, não duas cópias.
export const ROLE_HOME: Record<string, string> = {
  administrador: "/coa",
  concierge: "/coa/atendimento",
  profissional: "/profissional",
  paciente: "/paciente",
  curador_medico: "/coa/curadoria",
};

const ROLE_PORTAL_LABELS: Record<string, string> = {
  paciente: "Minha Jornada",
  curador_medico: "Curadoria",
  administrador: "Centro de Operações",
  concierge: "Atendimento",
  profissional: "Meu portal",
};

const ROLE_PRIORITY = [
  "paciente",
  "curador_medico",
  "administrador",
  "concierge",
  "profissional",
] as const;

export function getRoleHome(roles: string[], fallback = "/"): string {
  const match = roles.find((role) => role in ROLE_HOME);
  return match ? ROLE_HOME[match] : fallback;
}

export type AuthenticatedPortalCta = {
  label: string;
  href: string;
};

export function getAuthenticatedPortalCta(roles: string[]): AuthenticatedPortalCta | null {
  const role = ROLE_PRIORITY.find((entry) => roles.includes(entry));
  if (!role) {
    return null;
  }

  return {
    label: ROLE_PORTAL_LABELS[role],
    href: ROLE_HOME[role],
  };
}
