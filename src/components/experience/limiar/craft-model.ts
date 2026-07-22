import type { LandingRevealLine } from "./landing-line-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";

/**
 * O Ofício — o que muda na vida de alguém porque a Aliviar existe.
 * Revela o trabalho; não explica empresa nem vende curadoria.
 */
export function buildCraftLines(): LandingRevealLine[] {
  const begin = LANDING_SECTION_MS.craft;
  const gap = STAGE_MS.sectionLineGap;

  return [
    {
      text: "O que muda não é a doença — é o peso de decidir sozinho.",
      delayMs: begin,
    },
    {
      text: "Alguém escuta, estuda, compara — com rigor, sem pressa.",
      delayMs: begin + gap,
    },
    {
      text: "Você ganha clareza. E companhia no caminho.",
      delayMs: begin + gap * 2,
    },
  ];
}
