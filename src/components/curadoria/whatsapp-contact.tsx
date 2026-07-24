/**
 * Contato pelo WhatsApp, sempre contextualizado (MISSÃO 205).
 *
 * @metodo Jornada §1 — R1: o Sistema nunca fala com o paciente sem passar por uma pessoa
 * @metodo Experience §2.7 — o vínculo é com pessoas, não com um sistema: ele sabe para quem escrever
 * @metodo Fundamentos §13 — P11: nenhuma etapa aumenta a ansiedade; nada aqui cobra ou pressiona
 *
 * Por que existe: o WhatsApp é extensão da mesma conversa, nunca uma saída de
 * emergência nem um menu principal. Cada ponto de contato já chega com o
 * assunto escrito — o paciente nunca precisa explicar quem é nem em que etapa
 * está.
 *
 * O que nunca faz: virar navegação principal, aparecer como chat aberto, ou
 * prometer resposta imediata. A mensagem pré-preenchida é um começo de frase,
 * nunca uma fala colocada na boca dele.
 */

import { cn } from "@/components/ui/cn";

/**
 * Número oficial da Aliviar, fornecido pelo responsável do projeto na
 * MISSÃO 205. Até então nenhum número existia em documento aprovado, e por
 * isso `docs/LANDING_CREATIVE_DIRECTION.md` §8 proibia inventar um — esta
 * constante fecha aquela lacuna. Fonte única: qualquer superfície que precise
 * do número importa daqui, nunca reescreve o literal.
 */
export const ALIVIAR_WHATSAPP = "5511979037133";
export const ALIVIAR_WHATSAPP_DISPLAY = "(11) 97903-7133";

export type WhatsappTopic = "duvida" | "documento" | "curador";

const TOPICS: Record<WhatsappTopic, { label: string; message: string }> = {
  duvida: {
    label: "Dúvida sobre minha Curadoria",
    message: "Oi! Tenho uma dúvida sobre a minha Curadoria.",
  },
  documento: {
    label: "Enviar um documento",
    message: "Oi! Quero enviar um documento para a minha Curadoria.",
  },
  curador: {
    label: "Falar com meu Curador",
    message: "Oi! Gostaria de falar com meu Curador.",
  },
};

export function whatsappHref(topic: WhatsappTopic): string {
  return `https://wa.me/${ALIVIAR_WHATSAPP}?text=${encodeURIComponent(TOPICS[topic].message)}`;
}

export function WhatsappContact({
  topics = ["duvida", "documento", "curador"],
  className,
}: {
  topics?: WhatsappTopic[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-surface p-4", className)}>
      <h2 className="font-sans text-sm font-semibold text-ink">Precisa falar com a gente?</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        É a mesma conversa, no WhatsApp {ALIVIAR_WHATSAPP_DISPLAY}. Sem pressa — responderemos.
      </p>
      <ul className="mt-3 space-y-2">
        {topics.map((topic) => (
          <li key={topic}>
            <a
              href={whatsappHref(topic)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {TOPICS[topic].label}
              <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
