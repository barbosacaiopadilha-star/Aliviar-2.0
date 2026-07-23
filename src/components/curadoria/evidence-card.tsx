/**
 * Evidência de Curadoria — a fala que originou um peso.
 *
 * @metodo Fundamentos §12 — cada peso nasce de uma evidência; peso sem evidência não existe
 * @metodo Ontologia §3.6 — o Peso é sempre o par valor + Evidência de Curadoria
 * @metodo Experience §2.3 — mostrar os pesos aumenta credibilidade porque a evidência está junto
 * @metodo Engine §5.2 — o Motor de Pesos nunca aceita peso sem evidência
 *
 * Por que existe: um número sozinho seria arbitrário e assustador. Com a frase
 * do paciente ao lado, o paciente não vê um número do sistema — vê a si mesmo.
 * É isso que separa transparência de exposição.
 *
 * O que nunca faz: aceitar a ausência em silêncio. Sem evidência, o cartão diz
 * o que falta em linguagem de conversa ("qual momento originou este peso?"),
 * nunca um "campo obrigatório" em vermelho.
 */

import { cn } from "@/components/ui/cn";

export function EvidenceCard({
  evidence,
  className,
}: {
  evidence: string | null;
  className?: string;
}) {
  const hasEvidence = Boolean(evidence?.trim());

  if (!hasEvidence) {
    return (
      <p className={cn("text-sm leading-relaxed text-ink-muted", className)}>
        Qual momento da conversa originou este peso?
      </p>
    );
  }

  return (
    <blockquote
      className={cn(
        "border-l-2 border-brand-gold/60 pl-3 text-sm italic leading-relaxed text-ink-muted",
        className,
      )}
    >
      {evidence}
    </blockquote>
  );
}
