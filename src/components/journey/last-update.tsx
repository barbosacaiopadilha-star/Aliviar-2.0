/**
 * Última atualização — quem mexeu nisto por último, e quando.
 *
 * @metodo Guided Experience §2 — pergunta 2 (o que já aconteceu, com autor e data)
 * @metodo UX_PRINCIPLES P7 — "não sei" nunca vira zero
 *
 * Por que existe: a ansiedade número um de quem espera é "fui esquecido?".
 * Uma linha dizendo que uma pessoa com nome tocou neste caso hoje responde
 * essa pergunta antes que ela seja feita — e responde para todos os perfis,
 * porque a dúvida é a mesma no paciente e no Concierge.
 *
 * O que nunca faz: inventar movimento. Sem evento registrado, diz que ainda
 * não houve — jamais a data de agora, jamais "atualizado" genérico.
 */
export function LastUpdate({
  at,
  by,
  what,
  role,
}: {
  /** ISO do último evento real. `null` quando ainda não houve nenhum. */
  at: string | null;
  /** Nome de quem agiu. "Sistema" quando foi o sistema — nunca vazio. */
  by?: string | null;
  /** O que aconteceu, em uma frase. */
  what?: string | null;
  /** Papel humano de quem agiu ("Curadora Médica"). */
  role?: string | null;
}) {
  if (!at) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhuma movimentação registrada ainda.
      </p>
    );
  }

  const quando = new Date(at);
  const hoje = new Date();
  const mesmoDia =
    quando.getFullYear() === hoje.getFullYear() &&
    quando.getMonth() === hoje.getMonth() &&
    quando.getDate() === hoje.getDate();

  const dataLegivel = mesmoDia
    ? `Hoje às ${quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : quando.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="text-sm leading-relaxed text-ink-muted">
      <p>
        <span className="text-ink">Última atualização:</span> {dataLegivel}
        {by ? (
          <>
            {" "}
            por <span className="text-ink">{by}</span>
            {role ? `, ${role}` : ""}
          </>
        ) : null}
      </p>
      {what ? <p className="mt-0.5">{what}</p> : null}
    </div>
  );
}
