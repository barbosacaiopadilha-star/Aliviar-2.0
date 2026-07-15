import { describe, expect, it } from "vitest";

import { FRAMES } from "@/components/landing/portal-frames";
import {
  computeNarrativeFrame,
  FRAME_OFFSETS,
  TOTAL_HEIGHT_VH,
} from "@/components/landing/portal-narrative";

describe("computeNarrativeFrame", () => {
  it("progresso 0: primeira parada, no início, Hero ativo", () => {
    const result = computeNarrativeFrame(0);
    expect(result.fromIndex).toBe(0);
    expect(result.isAtStart).toBe(true);
    expect(result.isHeroActive).toBe(true);
    expect(result.isLeavingHero).toBe(false);
  });

  it("progresso 1: última parada, completamente avançado", () => {
    const result = computeNarrativeFrame(1);
    expect(result.toIndex).toBe(FRAMES.length - 1);
    expect(result.isAtEnd).toBe(true);
  });

  it("valor abaixo de 0 é tratado com segurança (clamp para 0)", () => {
    const result = computeNarrativeFrame(-0.5);
    expect(result.fromIndex).toBe(0);
    expect(result.isAtStart).toBe(true);
    expect(Number.isNaN(result.localProgress)).toBe(false);
  });

  it("valor acima de 1 é tratado com segurança (clamp para 1)", () => {
    const result = computeNarrativeFrame(1.5);
    expect(result.toIndex).toBe(FRAMES.length - 1);
    expect(result.isAtEnd).toBe(true);
    expect(Number.isNaN(result.localProgress)).toBe(false);
  });

  it("início exato de cada parada aponta fromIndex para aquela parada", () => {
    for (let i = 0; i < FRAMES.length - 1; i++) {
      const result = computeNarrativeFrame(FRAME_OFFSETS[i]);
      expect(result.fromIndex).toBe(i);
    }
  });

  it("meio do intervalo entre duas paradas (fora de platô) produz progresso local entre 0 e 1", () => {
    // Triagem (índice 2) não é uma parada de platô.
    const from = FRAME_OFFSETS[2];
    const to = FRAME_OFFSETS[3];
    const mid = from + (to - from) / 2;
    const result = computeNarrativeFrame(mid);
    expect(result.fromIndex).toBe(2);
    expect(result.localProgress).toBeGreaterThan(0);
    expect(result.localProgress).toBeLessThan(1);
  });

  it("limite imediatamente antes de uma mudança de parada ainda pertence à parada anterior", () => {
    const boundary = FRAME_OFFSETS[3];
    const result = computeNarrativeFrame(boundary - 0.0001);
    expect(result.fromIndex).toBe(2);
  });

  it("limite imediatamente depois de uma mudança de parada já pertence à nova parada", () => {
    const boundary = FRAME_OFFSETS[3];
    const result = computeNarrativeFrame(boundary + 0.0001);
    expect(result.fromIndex).toBe(3);
  });

  it("progressão para frente nunca retrocede o índice de origem", () => {
    const a = computeNarrativeFrame(0.2);
    const b = computeNarrativeFrame(0.4);
    expect(b.fromIndex).toBeGreaterThanOrEqual(a.fromIndex);
  });

  it("progressão reversa produz exatamente o mesmo resultado do mesmo ponto — função pura, sem memória de direção", () => {
    const forward = computeNarrativeFrame(0.5);
    computeNarrativeFrame(0.7); // avança
    const backAgain = computeNarrativeFrame(0.5); // volta ao mesmo ponto
    expect(backAgain).toEqual(forward);
  });

  it("não existe índice anterior ao início — fromIndex nunca é negativo", () => {
    const result = computeNarrativeFrame(0);
    expect(result.fromIndex).toBeGreaterThanOrEqual(0);
  });

  it("não existe índice além do fim — toIndex nunca ultrapassa a última parada", () => {
    expect(computeNarrativeFrame(1).toIndex).toBeLessThanOrEqual(
      FRAMES.length - 1,
    );
    expect(computeNarrativeFrame(5).toIndex).toBeLessThanOrEqual(
      FRAMES.length - 1,
    );
  });

  it("Hero (parada 0) ativo só dentro do próprio intervalo", () => {
    expect(computeNarrativeFrame(0).isHeroActive).toBe(true);
    expect(computeNarrativeFrame(FRAME_OFFSETS[1] - 0.001).isHeroActive).toBe(
      true,
    );
    expect(computeNarrativeFrame(FRAME_OFFSETS[1] + 0.001).isHeroActive).toBe(
      false,
    );
  });

  it("saída do Hero (isLeavingHero) no threshold real de início de avanço", () => {
    expect(computeNarrativeFrame(0).isLeavingHero).toBe(false);
    expect(computeNarrativeFrame(0.001).isLeavingHero).toBe(true);
  });

  it("nunca produz valor não finito (divisão por zero) em nenhum ponto amostrado", () => {
    for (let overall = 0; overall <= 1; overall += 0.05) {
      expect(
        Number.isFinite(computeNarrativeFrame(overall).localProgress),
      ).toBe(true);
    }
  });

  it("nunca produz NaN, mesmo para entrada não finita", () => {
    for (const input of [NaN, Infinity, -Infinity, -100, 100]) {
      const result = computeNarrativeFrame(input);
      expect(Number.isNaN(result.localProgress)).toBe(false);
      expect(Number.isNaN(result.fromIndex)).toBe(false);
      expect(Number.isNaN(result.toIndex)).toBe(false);
    }
  });

  it("fromIndex e toIndex sempre dentro dos limites reais de FRAMES", () => {
    for (const input of [-10, 0, 0.33, 0.5, 0.99, 1, 10]) {
      const result = computeNarrativeFrame(input);
      expect(result.fromIndex).toBeGreaterThanOrEqual(0);
      expect(result.fromIndex).toBeLessThan(FRAMES.length);
      expect(result.toIndex).toBeGreaterThanOrEqual(0);
      expect(result.toIndex).toBeLessThan(FRAMES.length);
    }
  });

  it("TOTAL_HEIGHT_VH é a soma exata das alturas de todas as paradas", () => {
    const expected = FRAMES.reduce((sum, frame) => sum + frame.heightVh, 0);
    expect(TOTAL_HEIGHT_VH).toBe(expected);
  });
});
