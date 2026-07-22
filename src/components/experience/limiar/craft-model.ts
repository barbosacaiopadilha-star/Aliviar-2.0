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
      text: "Deixa de pesar decidir sozinho.",
      delayMs: begin,
    },
    {
      text: "Alguém estuda e compara.",
      delayMs: begin + gap,
    },
  ];
}
