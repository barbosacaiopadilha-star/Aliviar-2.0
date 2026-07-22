import type { LandingRevealLine } from "./landing-line-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";

export const LANDING_INVITE_HREF = "/conversa";

/** Texto do gesto — continuação da conversa, não CTA comercial. */
export const LANDING_INVITE_GESTURE = "Podemos conversar.";

/** Despedida do limiar — permissão para sair e voltar. */
export const LANDING_FAREWELL_LINE = "Pode fechar esta página. A luz fica acesa.";

/**
 * O Convite — único gesto da landing.
 * Desejo de contar; não captura nem botão comercial.
 */
export function buildInviteLines(): LandingRevealLine[] {
  const begin = LANDING_SECTION_MS.invite;
  const gap = STAGE_MS.sectionLineGap;

  return [
    {
      text: "Quando quiser, conte sua história.",
      delayMs: begin,
    },
    {
      text: LANDING_INVITE_GESTURE,
      delayMs: begin + gap,
    },
  ];
}

export function buildFarewellLine(): LandingRevealLine {
  return {
    text: LANDING_FAREWELL_LINE,
    delayMs: LANDING_SECTION_MS.farewell,
  };
}
