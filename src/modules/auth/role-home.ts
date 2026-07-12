// Mapa interno e fixo (não input do usuário) de papel -> rota inicial.
// Usado tanto para o redirecionamento padrão pós-login (sem `next`) quanto
// para o link de volta em /acesso-negado — um único lugar, não duas cópias.
export const ROLE_HOME: Record<string, string> = {
  administrador: "/admin",
  profissional: "/profissional",
  paciente: "/paciente",
};

export function getRoleHome(roles: string[], fallback = "/"): string {
  const match = roles.find((role) => role in ROLE_HOME);
  return match ? ROLE_HOME[match] : fallback;
}
