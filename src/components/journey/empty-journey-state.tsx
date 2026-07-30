import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";

/**
 * Estado vazio de jornada — vazio que informa, nunca vazio que assusta.
 *
 * @metodo UX_PRINCIPLES P11 — estado vazio é informação
 *
 * Por que existe: "Nenhum registro encontrado" responde zero das quatro
 * perguntas de um vazio (por quê? o que significa? o que fará algo aparecer?
 * há ação?). Este wrapper torna as respostas obrigatórias por tipo — quem
 * monta a tela não consegue entregar um vazio mudo.
 *
 * O que nunca faz: botão decorativo — `action` só entra quando existe ação
 * real (P11), e a atualidade da lista é afirmada, não presumida.
 */
export function EmptyJourneyState({
  title,
  becauseOf,
  whatWillHappen,
  upToDateLabel = "A lista está atualizada — nada foi perdido e nada está carregando.",
  action,
}: {
  /** Título claro do vazio, sem tom de erro. */
  title: string;
  /** Por que está vazio, em uma frase. */
  becauseOf: string;
  /** O que fará algo aparecer aqui. */
  whatWillHappen: string;
  /** Afirmação de atualidade (ou omissão consciente passando string vazia). */
  upToDateLabel?: string;
  /** Só quando existe ação real — nunca "Continuar", nunca decorativo. */
  action?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <EmptyState title={title} description={`${becauseOf} ${whatWillHappen}`} />
      {upToDateLabel ? <p className="text-center text-xs text-ink-muted">{upToDateLabel}</p> : null}
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
