import { whatsappHref, type WhatsappTopic } from "@/components/curadoria/whatsapp-contact";
import { cn } from "@/components/ui/cn";

/**
 * TRACK C · A PORTA — "Falar com a Aliviar".
 *
 * Antes desta Track a paciente só conseguia pedir ajuda **depois de já ter
 * decidido**: havia um único ponto de contato, no estado decidido do painel de
 * decisão. O momento em que ela lê três caminhos médicos e escolhe não tinha
 * porta nenhuma (contrato 30 §2.1).
 *
 * Regras que este componente existe para cumprir, e nenhuma é estilo:
 *
 * - **o rótulo é sempre o mesmo**, nos sete pontos: *Falar com a Aliviar*. O
 *   assunto vive na MENSAGEM, nunca no texto do link — [09 §2] vence a lista
 *   de rótulos por assunto que `WhatsappContact` usa (contrato 30 §3);
 * - **quem responde é a Aliviar**, nunca um profissional e nunca um Curador
 *   nominal. Por isso o tópico `curador` existe no código e não é ligado aqui;
 * - **nenhum horário, nenhum SLA, nenhuma promessa de prazo.** Declarar horário
 *   cria compromisso que ninguém aprovou — a mesma doutrina que
 *   `continuity-worklist.ts` já aplica. O canal promete existir, nunca
 *   prometer quando;
 * - **nenhum texto livre.** A garantia é de TIPO: `whatsappHref` aceita
 *   somente `WhatsappTopic`, este componente só repassa o tópico, e não há
 *   prop de mensagem nem de telefone. Não existe caminho para vazar
 *   diagnóstico, condição, nome ou identificador de Caso (contrato 30 §7);
 * - **o clique não é registrado.** Nenhum `audit_logs`, nenhum evento, nenhuma
 *   analítica: registrar transformaria a paciente em objeto de medição
 *   (contrato 30 §8).
 *
 * Acessibilidade: alvo mínimo de 44px (`min-h-11`), anel de foco visível,
 * compreensível sem cor (é texto, com sublinhado no foco/hover) e o aviso de
 * nova aba dito ANTES do clique, por `sr-only`.
 */
export function ConciergeLink({
  topic,
  className,
  nota = false,
}: {
  /** O assunto. Tipado — não existe forma de passar mensagem livre. */
  topic: WhatsappTopic;
  className?: string;
  /**
   * A frase institucional adotada como padrão no lugar de horário de
   * atendimento (contrato 30 §3). Fica DESLIGADA por padrão: os pontos
   * discretos são uma linha de texto no registro visual do material de
   * consulta, e um parágrafo ao lado deles seria ruído. Ligada onde há
   * espaço de bloco — o estado vazio da Curadoria.
   */
  nota?: boolean;
}) {
  const link = (
    <a
      href={whatsappHref(topic)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center text-sm font-medium text-[var(--patient-acento)]",
        "underline-offset-4 hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* O espaço é explícito de propósito: o JSX descarta o que houver antes
          da quebra de linha, e sem ele o nome acessível vira
          "Aliviar(abre o WhatsApp…" — colado, e é assim que o leitor de tela
          anuncia. */}
      Falar com a Aliviar{" "}
      <span className="sr-only">(abre o WhatsApp em nova aba)</span>
    </a>
  );

  if (!nota) return link;

  return (
    <div>
      {link}
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        Sem pressa — responderemos.
      </p>
    </div>
  );
}
