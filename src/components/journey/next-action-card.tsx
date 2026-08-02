import type { ReactNode } from "react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Próxima Ação — o cartão que responde "o que depende de mim?".
 *
 * @metodo Guided Experience §2 — perguntas 4 e 5
 * @metodo UX_PRINCIPLES P2 — a próxima ação nunca se esconde, nem quando não existe
 * @metodo UX_PRINCIPLES P3 — o botão nomeia o efeito, nunca "Continuar"
 *
 * Por que existe: a próxima ação vivia espalhada (botão no fim da página,
 * link no meio de um parágrafo, ou lugar nenhum — o bug do Acolhimento).
 * Este cartão dá endereço fixo a ela e responde as quatro perguntas que uma
 * pendência precisa responder: o que falta (título), por que importa (`why`),
 * o que acontece depois (`whatHappensNext`) e qual é a ação (`action`).
 *
 * Este é o componente único de pendência da plataforma — paciente, Atendente,
 * Curador, Concierge e Administrador usam este, não um por perfil. Dois
 * componentes respondendo "o que depende de mim" seriam duas respostas
 * possíveis para a mesma pergunta.
 *
 * O que nunca faz: renderizar duas ações primárias, ou sumir em silêncio —
 * sem `action`, `nothingPending` é obrigatório por tipo.
 */
type NextActionCardProps =
  | {
      title: string;
      why?: string;
      /** O que acontece depois que esta ação for feita. Reduz ansiedade (P2). */
      whatHappensNext?: string;
      action: ReactNode;
      nothingPending?: never;
    }
  | {
      title?: string;
      why?: string;
      whatHappensNext?: string;
      action?: never;
      /** Ex.: "Nada depende de você agora — o caso está com a equipe." */
      nothingPending: string;
    };

export function NextActionCard(props: NextActionCardProps) {
  if (props.action) {
    return (
      <Card className="border-[color-mix(in_srgb,var(--color-brand-gold)_40%,transparent)]">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          {props.why ? <CardDescription>{props.why}</CardDescription> : null}
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">{props.action}</div>
        {props.whatHappensNext ? (
          <p className="mt-3 max-w-reading border-t border-border pt-3 text-sm leading-relaxed text-ink-muted">
            Depois disso: {props.whatHappensNext}
          </p>
        ) : null}
      </Card>
    );
  }

  return (
    <Card>
      {props.title ? (
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
      ) : null}
      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">{props.nothingPending}</p>
      {props.whatHappensNext ? (
        <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink-muted">
          Depois disso: {props.whatHappensNext}
        </p>
      ) : null}
    </Card>
  );
}
