import { describe, expect, it } from "vitest";

import { computePhotographyFrame } from "@/components/landing/portal-photography";
import {
  PORTAL_SCENE_POSITIONS,
  PORTAL_SCENES,
} from "@/components/landing/portal-scenes";

const FULL_COUNT = PORTAL_SCENES.length;

describe("computePhotographyFrame", () => {
  it("progresso 0: primeira direção de fotografia, sem crossfade", () => {
    const result = computePhotographyFrame(0, FULL_COUNT);
    expect(result.fromIndex).toBe(0);
    expect(result.localProgress).toBe(0);
  });

  it("progresso 1: última direção de fotografia, crossfade completo", () => {
    const result = computePhotographyFrame(1, FULL_COUNT);
    expect(result.toIndex).toBe(FULL_COUNT - 1);
  });

  it("progresso abaixo de 0 é tratado com segurança (clamp para 0)", () => {
    const result = computePhotographyFrame(-2, FULL_COUNT);
    expect(result.fromIndex).toBe(0);
    expect(result.localProgress).toBeGreaterThanOrEqual(0);
  });

  it("progresso acima de 1 é tratado com segurança (clamp para 1)", () => {
    const result = computePhotographyFrame(5, FULL_COUNT);
    expect(result.toIndex).toBe(FULL_COUNT - 1);
  });

  it("nunca produz NaN, para nenhum progresso amostrado", () => {
    for (let overall = -1; overall <= 2; overall += 0.05) {
      const result = computePhotographyFrame(overall, FULL_COUNT);
      expect(Number.isNaN(result.fromIndex)).toBe(false);
      expect(Number.isNaN(result.toIndex)).toBe(false);
      expect(Number.isNaN(result.localProgress)).toBe(false);
    }
  });

  it("nunca produz Infinity, para nenhum progresso amostrado", () => {
    for (let overall = -1; overall <= 2; overall += 0.05) {
      const result = computePhotographyFrame(overall, FULL_COUNT);
      expect(Number.isFinite(result.localProgress)).toBe(true);
    }
  });

  it("primeira direção fotográfica (índice 0) no início do progresso", () => {
    expect(computePhotographyFrame(0, FULL_COUNT).fromIndex).toBe(0);
  });

  it("última direção fotográfica alcançada ao final do progresso", () => {
    expect(computePhotographyFrame(1, FULL_COUNT).toIndex).toBe(FULL_COUNT - 1);
  });

  it("meio entre duas direções produz progresso local entre 0 e 1", () => {
    const from = PORTAL_SCENE_POSITIONS[1];
    const to = PORTAL_SCENE_POSITIONS[2];
    const mid = from + (to - from) / 2;
    const result = computePhotographyFrame(mid, FULL_COUNT);
    expect(result.fromIndex).toBe(1);
    expect(result.localProgress).toBeGreaterThan(0);
    expect(result.localProgress).toBeLessThan(1);
  });

  it("fronteira exata entre segmentos aponta para o novo segmento", () => {
    const boundary = PORTAL_SCENE_POSITIONS[2];
    expect(computePhotographyFrame(boundary, FULL_COUNT).fromIndex).toBe(2);
  });

  it("continuidade: imediatamente antes e depois de uma fronteira não há salto de mais de um índice", () => {
    const boundary = PORTAL_SCENE_POSITIONS[2];
    const before = computePhotographyFrame(boundary - 0.0001, FULL_COUNT);
    const after = computePhotographyFrame(boundary + 0.0001, FULL_COUNT);
    expect(after.fromIndex - before.fromIndex).toBeLessThanOrEqual(1);
  });

  it("progressão para frente nunca retrocede o índice de origem", () => {
    const a = computePhotographyFrame(0.2, FULL_COUNT);
    const b = computePhotographyFrame(0.6, FULL_COUNT);
    expect(b.fromIndex).toBeGreaterThanOrEqual(a.fromIndex);
  });

  it("progressão reversa produz exatamente o mesmo resultado do mesmo ponto — função pura, sem memória", () => {
    const forward = computePhotographyFrame(0.5, FULL_COUNT);
    computePhotographyFrame(0.9, FULL_COUNT);
    const backAgain = computePhotographyFrame(0.5, FULL_COUNT);
    expect(backAgain).toEqual(forward);
  });

  it("estabilidade numérica: milhares de amostras nunca produzem índice ou progresso fora de faixa", () => {
    for (let i = 0; i < 5000; i++) {
      const overall = (Math.sin(i * 0.071) + 1) / 2;
      const result = computePhotographyFrame(overall, FULL_COUNT);
      expect(result.fromIndex).toBeGreaterThanOrEqual(0);
      expect(result.toIndex).toBeLessThan(FULL_COUNT);
      expect(result.localProgress).toBeGreaterThanOrEqual(0);
      expect(result.localProgress).toBeLessThanOrEqual(1);
    }
  });

  it("valores sempre dentro dos limites reais de cenas configuradas", () => {
    for (const overall of [-5, 0, 0.33, 0.5, 0.99, 1, 5]) {
      const result = computePhotographyFrame(overall, FULL_COUNT);
      expect(result.fromIndex).toBeGreaterThanOrEqual(0);
      expect(result.fromIndex).toBeLessThan(FULL_COUNT);
      expect(result.toIndex).toBeGreaterThanOrEqual(0);
      expect(result.toIndex).toBeLessThan(FULL_COUNT);
    }
  });

  it("equivalência manual: reproduz a fórmula original (índice por PORTAL_SCENE_POSITIONS + fração local) para um ponto isolado", () => {
    const overall = 0.6;
    let s0 = 0;
    while (
      s0 < PORTAL_SCENE_POSITIONS.length - 2 &&
      PORTAL_SCENE_POSITIONS[s0 + 1] <= overall
    )
      s0++;
    const s1 = Math.min(s0 + 1, FULL_COUNT - 1);
    const span = PORTAL_SCENE_POSITIONS[s1] - PORTAL_SCENE_POSITIONS[s0] || 1;
    const expectedT = Math.min(
      Math.max((overall - PORTAL_SCENE_POSITIONS[s0]) / span, 0),
      1,
    );

    const result = computePhotographyFrame(overall, FULL_COUNT);
    expect(result.fromIndex).toBe(s0);
    expect(result.toIndex).toBe(s1);
    expect(result.localProgress).toBeCloseTo(expectedT, 10);
  });

  it("independência do Motor Narrativo: nenhuma configuração de paradas (FRAMES) é necessária para este módulo funcionar", () => {
    // Este próprio arquivo de teste roda na camada tests/unit/ (ambiente
    // node puro, sem transform de JSX) — só é possível porque
    // portal-photography.ts nunca importa portal-frames.tsx nem
    // portal-narrative.ts, ao contrário dos motores Narrativo e Ambiente
    // (que precisaram ir para tests/components/ por esse motivo).
    expect(computePhotographyFrame(0.5, FULL_COUNT)).toBeDefined();
  });

  it("invariante de configuração: scenesCount menor que o total configurado limita apenas toIndex — comportamento original preservado, não simetrizado", () => {
    // Fiel ao código original: o avanço de `fromIndex` percorre
    // PORTAL_SCENE_POSITIONS inteiro, sem conhecer `scenesCount` — só
    // `toIndex` é limitado por ele. Com scenesCount=1 e overall=1,
    // fromIndex ainda pode avançar até o penúltimo índice de posição
    // configurado; toIndex fica travado em 0 (única cena real).
    const result = computePhotographyFrame(1, 1);
    expect(result.fromIndex).toBe(PORTAL_SCENE_POSITIONS.length - 2);
    expect(result.toIndex).toBe(0);
  });

  it("scenesCount igual a zero é tratado com segurança, sem lançar exceção", () => {
    expect(() => computePhotographyFrame(0.5, 0)).not.toThrow();
    const result = computePhotographyFrame(0.5, 0);
    expect(Number.isNaN(result.localProgress)).toBe(false);
  });

  it("scenesCount intermediário (2 de 6 cenas reais) nunca aponta para um índice inexistente", () => {
    for (let overall = 0; overall <= 1; overall += 0.1) {
      const result = computePhotographyFrame(overall, 2);
      expect(result.toIndex).toBeLessThanOrEqual(1);
    }
  });
});
