// Mapa interno e fixo (não input do usuário) de papel -> rota inicial.
// Usado tanto para o redirecionamento padrão pós-login (sem `next`) quanto
// para o link de volta em /acesso-negado — um único lugar, não duas cópias.
// `curador_medico` faltava aqui: um Curador que logasse sem `?next=` caía em
// "/", a Landing pública, como se não tivesse conta. Agora vai para o Portal
// do Curador — a superfície do Método, não o painel do ACE antigo.
//
// Os três níveis humanos do domínio (docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md)
// têm, cada um, a sua própria superfície:
//
//   Nível 1 — Atendente:  /atendimento    — qualifica, converte, abre o Case
//   Nível 2 — Curador:    /portal-curador — conduz a Curadoria sobre o MESMO Case
//   Nível 3 — Concierge:  /acompanhamento — acompanha o paciente depois
//
// Nenhum deles aponta para `/admin`: mandar um Atendente para o painel
// administrativo resolveria a navegação criando escalada de privilégio, e
// acesso global é do Administrador — que justamente por isso não é o ator
// padrão de nenhum Case.
//
// A ORDEM AQUI IMPORTA. `getRoleHome` devolve o primeiro papel que casar, e
// quem acumula papéis (hoje há uma pessoa com três) cai no primeiro da lista
// dela. `administrador` vem primeiro porque quem tem esse papel precisa da
// visão global ao entrar.
export const ROLE_HOME: Record<string, string> = {
  administrador: "/admin",
  atendente: "/atendimento",
  curador_medico: "/portal-curador",
  concierge: "/acompanhamento",
  profissional: "/profissional",
  paciente: "/portal-paciente",
};

export function getRoleHome(roles: string[], fallback = "/"): string {
  const match = roles.find((role) => role in ROLE_HOME);
  return match ? ROLE_HOME[match] : fallback;
}
