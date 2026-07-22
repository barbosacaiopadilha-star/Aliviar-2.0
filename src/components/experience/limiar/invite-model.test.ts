import { describe, expect, it } from "vitest";

import {
  LANDING_FAREWELL_LINE,
  LANDING_INVITE_GESTURE,
  LANDING_INVITE_HREF,
  buildFarewellLine,
  buildInviteLines,
} from "./invite-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";
import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";

describe("invite-model", () => {
  it("revela um único convite após o caminho", () => {
    const lines = buildInviteLines();
    expect(lines).toHaveLength(2);
    expect(lines[0].delayMs).toBe(LANDING_SECTION_MS.invite);
    expect(lines[0].delayMs).toBeGreaterThan(LANDING_SECTION_MS.path);
    expect(lines[1].delayMs - lines[0].delayMs).toBe(STAGE_MS.sectionLineGap);
  });

  it("convida a contar — sem CTA comercial ou captura", () => {
    const text = buildInviteLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("história");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("comece agora");
    expect(text).not.toContain("clique");
    expect(text).not.toContain("grátis");
    expect(text).not.toContain("benefício");

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("aponta para a primeira conversa", () => {
    expect(LANDING_INVITE_HREF).toBe("/conversa");
    expect(LANDING_INVITE_GESTURE).toBe("Podemos conversar.");
  });

  it("encerra com permissão para sair", () => {
    const farewell = buildFarewellLine();
    expect(farewell.text).toBe(LANDING_FAREWELL_LINE);
    expect(farewell.delayMs).toBeGreaterThan(
      buildInviteLines()[1].delayMs + STAGE_MS.consolidationIn,
    );
  });
});
