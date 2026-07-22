import { buildCraftLines } from "./craft-model";
import { buildFilmContinuationLines } from "./continuation-model";
import { buildFarewellLine, buildInviteLines } from "./invite-model";
import type { LandingRevealLine } from "./landing-line-model";
import { buildPathLines } from "./path-model";
import { STAGE_MS } from "./stage-tokens";

/** Sequência completa da landing pós-filme — ordem emocional canônica. */
export function buildLandingFlowLines(): LandingRevealLine[] {
  return [
    ...buildFilmContinuationLines(),
    ...buildCraftLines(),
    ...buildPathLines(),
    ...buildInviteLines(),
    buildFarewellLine(),
  ];
}

/** Garante ritmo crescente entre todas as linhas da landing. */
export function landingFlowMinGapMs(): number {
  return STAGE_MS.consolidationIn;
}

export function isLandingFlowRhythmValid(lines: LandingRevealLine[]): boolean {
  const minGap = landingFlowMinGapMs();

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].delayMs < lines[index - 1].delayMs + minGap) {
      return false;
    }
  }

  return true;
}
