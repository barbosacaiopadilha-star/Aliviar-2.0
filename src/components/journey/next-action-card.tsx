import type { ReactNode } from "react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Próxima Ação — o cartão que responde "o que depende de mim?".
 *
 * @metodo Guided Experience §2 — pergunta 4
 * @metodo UX_PRINCIPLES P2 — a próxima ação nunca se esconde, nem quando não existe
 *
 * Por que existe: a próxima ação vivia espalhada (botão no fim da página,
 * link no meio de um parágrafo, ou lugar nenhum — o bug do Acolhimento).
 * Este cartão dá endereço fixo a ela: título = o efeito, descrição = por
 * quê agora, corpo = a ação pronta OU a declaração de que nada é da pessoa.
 *
 * O que nunca faz: renderizar duas ações primárias, ou sumir em silêncio —
 * sem `action`, `nothingPending` é obrigatório por tipo.
 */
type NextActionCardProps =
  | {
      title: string;
      why?: string;
      action: ReactNode;
      nothingPending?: never;
    }
  | {
      title?: string;
      why?: string;
      action?: never;
      /** Ex.: "Nada depende de você agora — o caso está com a equipe." */
      nothingPending: string;
    };

export function NextActionCard(props: NextActionCardProps) {
  if (props.action) {
    return (
      <Card className="border-brand-gold/40">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          {props.why ? <CardDescription>{props.why}</CardDescription> : null}
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">{props.action}</div>
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
    </Card>
  );
}
