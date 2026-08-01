/**
 * A saudação de quem trabalha nos fundos da casa.
 *
 * [CORRIGIDO — Onda 6] Este painel renderizava um `EmptyState` fixo —
 * "Ainda não há informações para exibir" — **acima de conteúdo real**: em
 * `/profissional` ele aparecia junto do Protocolo, das evidências e das
 * declarações da própria pessoa. Um vazio que mente sobre o que existe é
 * pior que nenhum vazio, e cada seção abaixo já sabe dizer quando está
 * vazia. O painel voltou a ser só o que sempre foi: quem chegou e em que
 * papel.
 */
export function DashboardPanel({
  displayName,
  roleLabel,
}: {
  displayName: string;
  roleLabel: string;
}) {
  return (
    <header>
      <h1 className="font-serif text-2xl font-normal text-ink">Olá, {displayName}</h1>
      <p className="mt-1 text-sm text-ink-muted">Você está na Aliviar como {roleLabel}.</p>
    </header>
  );
}
