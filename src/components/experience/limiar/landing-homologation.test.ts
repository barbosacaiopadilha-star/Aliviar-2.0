import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildLandingFlowLines } from "./landing-flow-model";

const LIMIAR_ROOT = resolve(import.meta.dirname);

function readComponent(name: string): string {
  return readFileSync(resolve(LIMIAR_ROOT, name), "utf8");
}

describe("landing homologation (R01)", () => {
  it("evita redundância de permanecer no ofício após a continuação", () => {
    const lines = buildLandingFlowLines().map((line) => line.text);
    const continuation = lines.slice(0, 3).join(" ").toLowerCase();
    const craft = lines.slice(3, 5).join(" ").toLowerCase();

    expect(continuation).toContain("permanecem");
    expect(craft).not.toContain("permanece");
  });

  it("não expõe rótulos de seção que quebrem a conversa", () => {
    const experience = readComponent("LimiarExperience.tsx");
    const invite = readComponent("LimiarInviteSection.tsx");

    expect(experience).not.toContain('label="Continuação"');
    expect(experience).not.toContain('label="O ofício"');
    expect(experience).not.toContain('label="O caminho"');
    expect(invite).not.toContain('aria-label="Convite"');
  });

  it("mantém o rodapé discreto — sem nome de marca no gesto de equipe", () => {
    const experience = readComponent("LimiarExperience.tsx");

    expect(experience).toMatch(/>\s*Equipe\s*<\/Link>/);
    expect(experience).not.toContain("Equipe Aliviar");
  });

  it("esconde linhas reveladas até a animação (leitores de tela)", () => {
    const css = readFileSync(resolve(LIMIAR_ROOT, "../../../app/globals.css"), "utf8");

    expect(css).toMatch(/\.limiar__reveal-line[\s\S]*visibility:\s*hidden/);
    expect(css).toMatch(/@keyframes stage-voice-in[\s\S]*visibility:\s*visible/);
  });

  it("mantém reduced motion funcional no limiar", () => {
    const css = readFileSync(resolve(LIMIAR_ROOT, "../../../app/globals.css"), "utf8");

    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.limiar__hint/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.limiar__lamp-btn/);
  });
});
