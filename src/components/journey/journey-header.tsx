import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

/**
 * Cabeçalho de jornada — o topo de TODA superfície autenticada.
 *
 * @metodo Guided Experience §2 — as Cinco Perguntas
 * @metodo UX_PRINCIPLES P1 — uma tela, uma pergunta, uma ação principal
 *
 * Por que existe: cada superfície respondia "onde estou / o que acontece /
 * o que depende de mim" do seu próprio jeito — quando respondia. Este
 * componente torna as respostas estruturais: quem monta uma tela nova é
 * OBRIGADO pelos props a dizer o momento, o estado e a próxima ação (ou a
 * declarar que não há). Não dá para esquecer o que é campo obrigatório.
 *
 * O que nunca faz: inventar resposta. `nothingPendingLabel` só aparece
 * quando quem monta a tela afirmou que nada depende da pessoa — silêncio
 * certo é informação (Experience §5).
 */
export function JourneyHeader({
  moment,
  status,
  statusVariant = "default",
  context,
  nextAction,
  nothingPendingLabel,
  backHref,
  backLabel,
}: {
  /** Onde estou — nome do momento em linguagem da jornada, vira o h1. */
  moment: string;
  /** O que está acontecendo agora — estado honesto, curto. */
  status?: string;
  statusVariant?: "default" | "sage";
  /** O que já aconteceu / contexto de uma linha (autor e data quando couber). */
  context?: string;
  /**
   * O que depende de mim — a ação principal (botão/link já pronto).
   * Exatamente UMA, nomeada pelo efeito (P3: proibido "Continuar").
   */
  nextAction?: ReactNode;
  /** Quando NADA depende da pessoa, dizer isso é obrigatório — não omitir. */
  nothingPendingLabel?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="space-y-2">
      {backHref ? (
        <a
          href={backHref}
          className="text-sm text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          ← {backLabel ?? "Voltar"}
        </a>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl text-ink">{moment}</h1>
        {status ? <Badge variant={statusVariant}>{status}</Badge> : null}
      </div>

      {context ? <p className="max-w-reading text-sm text-ink-muted">{context}</p> : null}

      {nextAction ? (
        <div className="pt-2">{nextAction}</div>
      ) : nothingPendingLabel ? (
        <p className="pt-1 text-sm text-ink-muted">{nothingPendingLabel}</p>
      ) : null}
    </header>
  );
}
