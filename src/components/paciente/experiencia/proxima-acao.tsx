import Link from "next/link";

import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { StateMark } from "@/components/ui/state-mark";
import type { PatientPendingState } from "@/modules/paciente/next-action";

/**
 * A PRÓXIMA AÇÃO DA PACIENTE — o nível 2 da Home.
 *
 * @metodo docs/repaginacao/13_MODELO_DE_ESTADOS.md §4 — cor nunca sozinha
 * @metodo UX_PRINCIPLES P2 — a próxima ação nunca se esconde, nem quando não existe
 *
 * Por que existe: `derivePatientPending` já calculava título, motivo, o que
 * acontece depois e destino — e a Home descartava tudo. O único consumo era um
 * `aside` no cartão da Curadoria, e ele só aparecia **quando a ação NÃO tinha
 * destino**. Ou seja: exatamente nos casos em que havia algo a fazer com uma
 * tela para fazê-lo, a Home não dizia nada. A pergunta "preciso fazer alguma
 * coisa agora?" ficava sem resposta.
 *
 * Este componente **não decide nada**. Ele recebe a projeção pronta e a
 * apresenta. Não há switch de etapa aqui, nem mapa paralelo de estados: um
 * segundo motor decidindo a mesma coisa foi o defeito que a Fundação existe
 * para impedir.
 *
 * Duas formas, uma por `kind`:
 *
 * - **há ação** — papel de atenção: falta um ato humano. Uma ação principal, e
 *   só uma. Quando o ato não acontece em tela, nenhum botão é inventado: o
 *   texto diz que é na conversa (Fundamentos §10 — a validação tem liturgia).
 * - **não há ação** — papel neutro: repouso, não erro. A tela declara o
 *   silêncio e diz o que vem depois, para que espera não se leia como falha.
 */
export function ProximaAcao({
  pending,
  curatorName,
}: {
  pending: PatientPendingState;
  /** Só usado quando o ato acontece numa conversa — nunca para inferir estado. */
  curatorName?: string;
}) {
  if (pending.kind === "nothing") {
    return (
      <PatientCard aria-labelledby="proxima-acao-titulo" className="patient-fade-in">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
          <StateMark papel="neutro">Em andamento</StateMark>
        </p>
        <h2
          id="proxima-acao-titulo"
          className="mt-3 font-serif text-xl font-medium leading-snug text-[var(--patient-ink)] lg:text-2xl"
        >
          {pending.message}
        </h2>
        <p className="patient-body mt-3 max-w-2xl text-[var(--color-ink-muted)]">
          {pending.whatHappensNext}
        </p>
      </PatientCard>
    );
  }

  const { title, why, whatHappensNext, cta, happensInConversation } = pending.action;

  return (
    <PatientCard
      aria-labelledby="proxima-acao-titulo"
      /* Um fio de dourado à esquerda — a mesma marca que o topo da casa usa.
         Não é badge, não é cor de fundo, não é sombra: é o mínimo que
         distingue "isto depende de você" do resto da página. */
      className="patient-fade-in border-l-2 border-l-[var(--color-brand-gold)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        <StateMark papel="atencao">Precisa de você</StateMark>
      </p>

      <h2
        id="proxima-acao-titulo"
        className="mt-3 font-serif text-xl font-medium leading-snug text-[var(--patient-ink)] lg:text-2xl"
      >
        {title}
      </h2>

      <p className="patient-body mt-3 max-w-2xl text-[var(--patient-ink)]">{why}</p>

      {cta ? (
        <Link
          // O destino vem da projeção. Remontar o caminho aqui recriaria a
          // segunda fonte de verdade que esta correção existe para eliminar.
          href={cta.href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--patient-acento)] px-6 text-sm font-medium text-[var(--patient-linen)] transition-colors duration-300 ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {cta.label}
        </Link>
      ) : happensInConversation ? (
        <p className="patient-body mt-4 text-[var(--color-ink-muted)]">
          Isso acontece na conversa com {curatorName ?? "seu Curador"} — não há nada para preencher
          aqui.
        </p>
      ) : null}

      <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--patient-ink)]">Depois disso:</span>{" "}
        {whatHappensNext}
      </p>
    </PatientCard>
  );
}
