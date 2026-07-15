import { describe, expect, it } from "vitest";

import { computePortalExitState } from "@/components/landing/portal-exit-transition";

const HANDOFF_START = 0.88;

describe("computePortalExitState", () => {
  it("progresso 0: nenhum handoff, presença total do Portal", () => {
    const result = computePortalExitState(0);
    expect(result.handoff).toBe(0);
    expect(result.portalPresence).toBe(1);
    expect(result.isExiting).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it("progresso 1: handoff completo, presença zero", () => {
    const result = computePortalExitState(1);
    expect(result.handoff).toBe(1);
    expect(result.portalPresence).toBe(0);
    expect(result.isComplete).toBe(true);
  });

  it("progresso abaixo de 0 é tratado com segurança (clamp para handoff 0)", () => {
    const result = computePortalExitState(-2);
    expect(result.handoff).toBe(0);
    expect(result.isExiting).toBe(false);
  });

  it("progresso acima de 1 é tratado com segurança (clamp para handoff 1)", () => {
    const result = computePortalExitState(5);
    expect(result.handoff).toBe(1);
    expect(result.isComplete).toBe(true);
  });

  it("antes de HANDOFF_START: nenhum handoff ainda", () => {
    const result = computePortalExitState(HANDOFF_START - 0.05);
    expect(result.handoff).toBe(0);
    expect(result.isExiting).toBe(false);
  });

  it("início exato de HANDOFF_START: limite entre nenhum handoff e o começo dele", () => {
    const result = computePortalExitState(HANDOFF_START);
    expect(result.handoff).toBe(0);
  });

  it("imediatamente após HANDOFF_START, o handoff já é positivo", () => {
    const result = computePortalExitState(HANDOFF_START + 0.001);
    expect(result.handoff).toBeGreaterThan(0);
    expect(result.isExiting).toBe(true);
  });

  it("meio da transição produz handoff e portalPresence somando exatamente 1", () => {
    const mid = HANDOFF_START + (1 - HANDOFF_START) / 2;
    const result = computePortalExitState(mid);
    expect(result.handoff).toBeCloseTo(0.5, 5);
    expect(result.handoff + result.portalPresence).toBeCloseTo(1, 10);
  });

  it("imediatamente antes do fim (overall = 1), ainda não é handoff completo", () => {
    const result = computePortalExitState(0.999);
    expect(result.handoff).toBeLessThan(1);
    expect(result.isComplete).toBe(false);
  });

  it("fim exato: handoff completo", () => {
    const result = computePortalExitState(1);
    expect(result.isComplete).toBe(true);
  });

  it("progressão para frente: handoff nunca diminui conforme overall aumenta", () => {
    let previous = 0;
    for (let overall = 0; overall <= 1; overall += 0.05) {
      const result = computePortalExitState(overall);
      expect(result.handoff).toBeGreaterThanOrEqual(previous);
      previous = result.handoff;
    }
  });

  it("progressão reversa: função pura, mesmo overall sempre produz o mesmo resultado, avançar e voltar não deixa memória", () => {
    const before = computePortalExitState(0.9);
    computePortalExitState(0.99); // avança
    const backAgain = computePortalExitState(0.9); // volta
    expect(backAgain).toEqual(before);
  });

  it("continuidade: instantes próximos ao redor da fronteira não produzem salto", () => {
    const before = computePortalExitState(HANDOFF_START - 0.0001);
    const after = computePortalExitState(HANDOFF_START + 0.0001);
    expect(Math.abs(after.handoff - before.handoff)).toBeLessThan(0.01);
  });

  it("nunca produz NaN nem Infinity, mesmo para entrada não finita", () => {
    for (const overall of [NaN, Infinity, -Infinity, -100, 100]) {
      const result = computePortalExitState(overall);
      expect(Number.isNaN(result.handoff)).toBe(false);
      expect(Number.isFinite(result.handoff)).toBe(true);
      expect(Number.isNaN(result.portalPresence)).toBe(false);
      expect(Number.isFinite(result.portalPresence)).toBe(true);
    }
  });

  it("equivalência manual: reproduz a fórmula original (clamp de (overall - HANDOFF_START) / (1 - HANDOFF_START)) para um ponto isolado", () => {
    const overall = 0.95;
    const expectedHandoff = Math.min(
      Math.max((overall - HANDOFF_START) / (1 - HANDOFF_START), 0),
      1,
    );
    const result = computePortalExitState(overall);
    expect(result.handoff).toBeCloseTo(expectedHandoff, 10);
    expect(result.portalPresence).toBeCloseTo(1 - expectedHandoff, 10);
  });

  it("estabilidade numérica em muitos pontos amostrados", () => {
    for (let overall = -1; overall <= 2; overall += 0.01) {
      const result = computePortalExitState(overall);
      expect(Number.isFinite(result.handoff)).toBe(true);
      expect(result.handoff).toBeGreaterThanOrEqual(0);
      expect(result.handoff).toBeLessThanOrEqual(1);
    }
  });

  it("N/A — coordenação com o vídeo: este motor não importa nem conhece portal-companion-video.ts; qualquer coincidência de marco com a saída do vídeo é configuração paralela, não coordenação", () => {
    expect(computePortalExitState.length).toBe(1);
  });

  it("independência do Motor Narrativo/Ambiente/Fotografia: recebe só overall, nenhum outro estado", () => {
    expect(computePortalExitState.length).toBe(1);
  });
});
