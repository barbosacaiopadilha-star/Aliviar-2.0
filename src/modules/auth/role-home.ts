// Mapa interno e fixo (não input do usuário) de papel -> rota inicial.
// Usado no redirecionamento pós-login, no link de /acesso-negado e no CTA
// da Landing — UM único mapa, nunca duas cópias que possam divergir.
//
// REINTEGRAÇÃO 2026-07-24: duas linhas de trabalho definiram mapas
// concorrentes (esta árvore: /atendimento, /acompanhamento, /portal-*;
// origin/main: /coa/*). A resolução preserva a arquitetura certificada:
// cada papel cai na superfície que executa as OPERAÇÕES AUDITADAS do
// domínio (qualificação, conversão, abertura e transferência do Case via
// funções do banco). As superfícies /coa/* seguem montadas como a
// plataforma CRM/COA — acessíveis, mas não são a home de papel.
//
//   Nível 1 — Atendente:  /atendimento    — qualifica, converte, abre o Case
//   Nível 2 — Curador:    /portal-curador — conduz a Curadoria (o COA
//                          reescreve /coa/curadoria para cá)
//   Nível 3 — Concierge:  /acompanhamento — acompanha após a Curadoria
//
// Nenhum nível operacional aponta para /admin: resolveria navegação criando
// escalada de privilégio. Acesso global é do Administrador — que por isso
// mesmo não é o ator padrão de nenhum Case.
export const ROLE_HOME: Record<string, string> = {
  administrador: "/admin",
  atendente: "/atendimento",
  curador_medico: "/portal-curador",
  concierge: "/acompanhamento",
  profissional: "/profissional",
  paciente: "/paciente",
};

const ROLE_PORTAL_LABELS: Record<string, string> = {
  paciente: "Minha Jornada",
  curador_medico: "Curadoria",
  administrador: "Centro de Operações",
  atendente: "Atendimento",
  concierge: "Acompanhamento",
  profissional: "Meu portal",
};

// Prioridade do CTA da Landing quando a pessoa acumula papéis: a experiência
// de paciente vence — quem é paciente E equipe entra pela própria jornada.
const ROLE_PRIORITY = [
  "paciente",
  "curador_medico",
  "atendente",
  "concierge",
  "administrador",
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

/**
 * CTA da Landing para quem já está autenticado. Deriva do MESMO mapa
 * ROLE_HOME — nunca de um segundo mapa que possa divergir dele.
 */
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
