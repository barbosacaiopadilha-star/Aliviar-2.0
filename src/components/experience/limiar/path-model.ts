import type { LandingRevealLine } from "./landing-line-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";

/**
 * A Jornada — o caminho em linguagem humana.
 * Sem timeline, etapas numeradas, cards ou fluxograma.
 */
export function buildPathLines(): LandingRevealLine[] {
  const begin = LANDING_SECTION_MS.path;
  const gap = STAGE_MS.sectionLineGap;

  return [
    {
      text: "Tudo começa quando você se faz ouvir.",
      delayMs: begin,
    },
    {
      text: "Não há roteiro para decorar — há uma conversa que ganha profundidade.",
      delayMs: begin + gap,
    },
    {
      text: "O caminho se revela devagar, no seu ritmo.",
      delayMs: begin + gap * 2,
    },
  ];
}
