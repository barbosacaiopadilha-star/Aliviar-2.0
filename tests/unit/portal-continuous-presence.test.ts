import { describe, expect, it } from "vitest";

import { computeContinuousPresence } from "@/components/landing/portal-continuous-presence";

const BREATH_PERIOD_MS = 9000;
const BREATH_AMPLITUDE = 0.015;

describe("computeContinuousPresence", () => {
  it("now = 0: breath começa no início do ciclo (seno de 0 é 0)", () => {
    const result = computeContinuousPresence(0);
    expect(result.breath).toBeCloseTo(0, 10);
  });

  it("breath oscila dentro da amplitude configurada, nunca além dela", () => {
    for (let now = 0; now <= BREATH_PERIOD_MS * 4; now += 137) {
      const result = computeContinuousPresence(now);
      expect(result.breath).toBeGreaterThanOrEqual(-BREATH_AMPLITUDE - 1e-9);
      expect(result.breath).toBeLessThanOrEqual(BREATH_AMPLITUDE + 1e-9);
    }
  });

  it("threadOpacity fica sempre entre 0.75 e 1 (nunca representa progresso ou porcentagem de scroll)", () => {
    for (let now = 0; now <= BREATH_PERIOD_MS * 4; now += 211) {
      const result = computeContinuousPresence(now);
      expect(result.threadOpacity).toBeGreaterThanOrEqual(0.75 - 1e-9);
      expect(result.threadOpacity).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("periodicidade: o valor se repete exatamente a cada BREATH_PERIOD_MS", () => {
    const a = computeContinuousPresence(1234);
    const b = computeContinuousPresence(1234 + BREATH_PERIOD_MS);
    expect(b.breath).toBeCloseTo(a.breath, 10);
    expect(b.threadOpacity).toBeCloseTo(a.threadOpacity, 10);
  });

  it("continuidade: instantes próximos produzem valores próximos, nunca um salto", () => {
    const a = computeContinuousPresence(5000);
    const b = computeContinuousPresence(5001);
    expect(Math.abs(a.breath - b.breath)).toBeLessThan(0.001);
  });

  it("função pura, sem memória: o mesmo `now` sempre produz o mesmo resultado, independente de chamadas anteriores", () => {
    const first = computeContinuousPresence(3000);
    computeContinuousPresence(8000);
    computeContinuousPresence(500);
    const again = computeContinuousPresence(3000);
    expect(again).toEqual(first);
  });

  it("nunca produz NaN ou Infinity, mesmo para entrada não finita", () => {
    for (const now of [NaN, Infinity, -Infinity, -5000]) {
      const result = computeContinuousPresence(now);
      expect(Number.isNaN(result.breath)).toBe(false);
      expect(Number.isFinite(result.breath)).toBe(true);
      expect(Number.isNaN(result.threadOpacity)).toBe(false);
      expect(Number.isFinite(result.threadOpacity)).toBe(true);
    }
  });

  it("equivalência manual: reproduz a fórmula original (seno + escala do fio) para um instante isolado", () => {
    const now = 4321;
    const expectedBreath =
      Math.sin((now / BREATH_PERIOD_MS) * Math.PI * 2) * BREATH_AMPLITUDE;
    const expectedThreadOpacity =
      0.875 + (expectedBreath / BREATH_AMPLITUDE) * 0.125;

    const result = computeContinuousPresence(now);
    expect(result.breath).toBeCloseTo(expectedBreath, 10);
    expect(result.threadOpacity).toBeCloseTo(expectedThreadOpacity, 10);
  });

  it("estabilidade numérica em muitos instantes amostrados", () => {
    for (let i = 0; i < 5000; i++) {
      const result = computeContinuousPresence(i * 173);
      expect(Number.isFinite(result.breath)).toBe(true);
      expect(Number.isFinite(result.threadOpacity)).toBe(true);
    }
  });

  it("N/A — dependência de overall/progresso: o Fio Dourado não representa progresso por regra semântica; esta função não recebe nem usa overall, apenas o relógio (now)", () => {
    expect(computeContinuousPresence.length).toBe(1);
  });
});
