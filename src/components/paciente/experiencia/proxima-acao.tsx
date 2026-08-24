import { LinkButton } from "@/components/landing/link-button";
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
 *
 * A3b · a forma deixou de ser cartão. A referência visual da Aliviar não tem
 * cartão flutuante em lugar nenhum: ela separa assuntos por **faixa e fio**,
 * com versalete acima e serifa no título. Aqui é a mesma gramática — o que
 * distingue este bloco não é sombra, é a faixa quente e o fio de dourado.
 */
/**
 * O botão da ação, sozinho — para o Hero mostrar sem repetir o bloco
 * inteiro (fusão de 23/08: no celular, o topo dizia o estado e o cartão
 * seguinte repetia a MESMA frase com o botão, gastando duas telas).
 */
export function AcaoPrincipal({ pending }: { pending: PatientPendingState }) {
  if (pending.kind === "nothing" || !pending.action.cta) return null;
  return (
    <LinkButton href={pending.action.cta.href} variant="primary">
      {pending.action.cta.label}
    </LinkButton>
  );
}

/**
 * CORTE FUNDO DE 23/08 (decisão do Fundador: "vamos manter apenas o que for
 * essencial"). A Home passou a ser UM cartão, e este é o miolo dele: o porquê
 * e o "depois disso" — sem faixa, sem fio, sem título próprio, porque já
 * estão dentro do cartão do estado.
 *
 * A projeção continua intocada: mesmo `derivePatientPending`, mesmas frases.
 * O que mudou foi a moldura, não a verdade. Quando o ato acontece na conversa
 * e não em tela, isso é dito aqui também — Fundamentos §10.
 */
export function PorqueEDepois({
  pending,
  curatorName,
}: {
  pending: PatientPendingState;
  curatorName?: string;
}) {
  if (pending.kind === "nothing") {
    return (
      <p className="patient-body max-w-xl text-sm text-[var(--color-ink-muted)]">
        {pending.whatHappensNext}
      </p>
    );
  }

  const { why, whatHappensNext, cta, happensInConversation } = pending.action;

  return (
    <div className="max-w-xl space-y-3">
      <p className="patient-body text-sm text-[var(--patient-ink)]">{why}</p>
      {!cta && happensInConversation ? (
        <p className="patient-body text-sm text-[var(--color-ink-muted)]">
          Isso acontece na conversa com {curatorName ?? "seu Curador"} — não há nada para preencher
          aqui.
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--patient-ink)]">Depois disso:</span>{" "}
        {whatHappensNext}
      </p>
    </div>
  );
}

export function ProximaAcao({
  pending,
  curatorName,
  semTituloEBotao = false,
}: {
  pending: PatientPendingState;
  /** Só usado quando o ato acontece numa conversa — nunca para inferir estado. */
  curatorName?: string;
  /**
   * Quando o Hero já mostra o estado e o botão, este bloco fica com o que
   * ele tem de próprio: o porquê e o "depois disso". Nada se perde — o que
   * some é a repetição.
   */
  semTituloEBotao?: boolean;
}) {
  if (pending.kind === "nothing") {
    return (
      <section
        aria-labelledby="proxima-acao-titulo"
        className="patient-fade-in border-t border-[var(--color-border)] pt-8"
      >
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
          <StateMark papel="neutro">Em andamento</StateMark>
        </p>
        <h2
          id="proxima-acao-titulo"
          className="mt-4 max-w-2xl font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-[1.75rem]"
        >
          {pending.message}
        </h2>
        <p className="patient-body mt-4 max-w-2xl text-[var(--color-ink-muted)]">
          {pending.whatHappensNext}
        </p>
      </section>
    );
  }

  const { title, why, whatHappensNext, cta, happensInConversation } = pending.action;

  return (
    <section
      aria-labelledby="proxima-acao-titulo"
      /* Faixa quente com fio de dourado à esquerda — sem sombra, sem
         flutuação. É o que distingue "isto depende de você" na mesma
         gramática que a Aliviar já usa lá fora: material, não efeito. */
      className="patient-fade-in border-l-2 border-l-[var(--color-brand-gold)] bg-[color-mix(in_srgb,var(--color-bg-canvas-warm)_50%,transparent)] py-8 pl-6 pr-5 lg:pl-8"
    >
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        <StateMark papel="atencao">Precisa de você</StateMark>
      </p>

      {semTituloEBotao ? null : (
        <h2
          id="proxima-acao-titulo"
          className="mt-4 max-w-2xl font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)] lg:text-[1.75rem]"
        >
          {title}
        </h2>
      )}

      <p className="patient-body mt-4 max-w-2xl text-[var(--patient-ink)]">{why}</p>

      {cta && !semTituloEBotao ? (
        // O botão é o MESMO da Aliviar pública (`LinkButton`), não um primo
        // parecido: a paciente autenticada não deveria sentir que entrou em
        // outro software. E o destino vem da projeção — remontá-lo aqui
        // recriaria a segunda fonte de verdade que a A3a eliminou.
        <LinkButton href={cta.href} variant="primary" className="mt-7">
          {cta.label}
        </LinkButton>
      ) : happensInConversation ? (
        <p className="patient-body mt-5 max-w-2xl text-[var(--color-ink-muted)]">
          Isso acontece na conversa com {curatorName ?? "seu Curador"} — não há nada para preencher
          aqui.
        </p>
      ) : null}

      <p className="mt-7 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--patient-ink)]">Depois disso:</span>{" "}
        {whatHappensNext}
      </p>
    </section>
  );
}
