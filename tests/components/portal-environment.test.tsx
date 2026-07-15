import { describe, expect, it } from "vitest";

import { FRAMES } from "@/components/landing/portal-frames";
import {
  computeNarrativeFrame,
  FRAME_OFFSETS,
} from "@/components/landing/portal-narrative";
import {
  createEnvironmentEngine,
  type EnvironmentState,
} from "@/components/landing/portal-environment";

// Motor Narrativo já testado em portal-narrative.test.tsx — aqui os
// NarrativeFrame de entrada vêm da função real (computeNarrativeFrame),
// não de objetos sintéticos, para comparar a matemática extraída com o
// pipeline real (overall → narrativa → ambiente), exatamente como
// portal-experience.tsx encadeia os dois motores.

const initialState = (): EnvironmentState => ({
  lightX: FRAMES[0].lightX,
  lightY: FRAMES[0].lightY,
  intensidade: FRAMES[0].intensidade,
  warmth: FRAMES[0].warmth,
  compact: FRAMES[0].compact,
});

describe("createEnvironmentEngine", () => {
  it("primeira parada: estado inicial já igual ao alvo, primeiro passo não desloca nada", () => {
    const engine = createEnvironmentEngine(initialState());
    const state = engine.step(computeNarrativeFrame(0));
    expect(state).toEqual(initialState());
  });

  it("última parada: após muitos passos, converge para os valores exatos da última parada", () => {
    const engine = createEnvironmentEngine(initialState());
    const last = FRAMES[FRAMES.length - 1];
    let state: EnvironmentState = initialState();
    for (let i = 0; i < 500; i++) {
      state = engine.step(computeNarrativeFrame(1));
    }
    expect(state.lightX).toBeCloseTo(last.lightX, 3);
    expect(state.lightY).toBeCloseTo(last.lightY, 3);
    expect(state.intensidade).toBeCloseTo(last.intensidade, 3);
    expect(state.warmth).toBeCloseTo(last.warmth, 3);
    expect(state.compact).toBeCloseTo(last.compact, 3);
  });

  it("transições: o estado se move na direção do alvo a cada passo, nunca se afasta dele", () => {
    const engine = createEnvironmentEngine(initialState());
    const target = FRAMES[FRAMES.length - 1];
    let previousDistance = Infinity;
    for (let i = 0; i < 50; i++) {
      const state = engine.step(computeNarrativeFrame(1));
      const distance = Math.abs(state.intensidade - target.intensidade);
      expect(distance).toBeLessThanOrEqual(previousDistance);
      previousDistance = distance;
    }
  });

  it("continuidade: passos consecutivos com o mesmo progresso nunca produzem salto abrupto", () => {
    const engine = createEnvironmentEngine(initialState());
    let previous = engine.step(computeNarrativeFrame(0.4));
    for (let i = 0; i < 20; i++) {
      const state = engine.step(computeNarrativeFrame(0.4));
      expect(Math.abs(state.lightX - previous.lightX)).toBeLessThan(5);
      expect(Math.abs(state.intensidade - previous.intensidade)).toBeLessThan(
        1,
      );
      previous = state;
    }
  });

  it("ausência de NaN em qualquer canal, para qualquer progresso amostrado", () => {
    const engine = createEnvironmentEngine(initialState());
    for (let overall = -0.5; overall <= 1.5; overall += 0.05) {
      const state = engine.step(computeNarrativeFrame(overall));
      expect(Number.isNaN(state.lightX)).toBe(false);
      expect(Number.isNaN(state.lightY)).toBe(false);
      expect(Number.isNaN(state.intensidade)).toBe(false);
      expect(Number.isNaN(state.warmth)).toBe(false);
      expect(Number.isNaN(state.compact)).toBe(false);
    }
  });

  it("limites: progresso fora de [0, 1] não quebra o motor (o Motor Narrativo já protege a entrada)", () => {
    const engine = createEnvironmentEngine(initialState());
    expect(() => engine.step(computeNarrativeFrame(-10))).not.toThrow();
    expect(() => engine.step(computeNarrativeFrame(10))).not.toThrow();
  });

  it("interpolação: no platô do Respiro, o alvo permanece travado nos valores da própria parada (holdEntireSpan)", () => {
    const respiroIndex = FRAMES.findIndex((frame) => frame.holdEntireSpan);
    expect(respiroIndex).toBeGreaterThan(-1);

    // Meio real da extensão do Respiro, derivado de FRAME_OFFSETS — nunca
    // um valor de progresso adivinhado/hardcoded.
    const midOfRespiro =
      FRAME_OFFSETS[respiroIndex] +
      (FRAME_OFFSETS[respiroIndex + 1] - FRAME_OFFSETS[respiroIndex]) / 2;
    const narrative = computeNarrativeFrame(midOfRespiro);

    expect(narrative.fromIndex).toBe(respiroIndex);
    expect(narrative.targetFrame).toBe(narrative.frame);
    expect(narrative.localProgress).toBe(0);
  });

  it("estabilidade numérica: milhares de passos com progresso oscilando nunca produzem valor infinito ou fora de faixa plausível", () => {
    const engine = createEnvironmentEngine(initialState());
    for (let i = 0; i < 3000; i++) {
      const overall = (Math.sin(i * 0.13) + 1) / 2; // oscila suavemente entre 0 e 1
      const state = engine.step(computeNarrativeFrame(overall));
      expect(Number.isFinite(state.lightX)).toBe(true);
      expect(Number.isFinite(state.intensidade)).toBe(true);
      expect(state.intensidade).toBeGreaterThan(-10);
      expect(state.intensidade).toBeLessThan(10);
    }
  });

  it("mesma matemática do comportamento anterior: replica manualmente lerp + amortecimento de um passo isolado", () => {
    const engine = createEnvironmentEngine(initialState());
    const narrative = computeNarrativeFrame(0.5);
    const state = engine.step(narrative);

    const a = narrative.frame;
    const b = narrative.targetFrame;
    const t = narrative.localProgress;
    const expectedTargetIntensidade =
      a.intensidade + (b.intensidade - a.intensidade) * t;
    const expectedIntensidade =
      FRAMES[0].intensidade +
      (expectedTargetIntensidade - FRAMES[0].intensidade) * 0.035;

    expect(state.intensidade).toBeCloseTo(expectedIntensidade, 10);
  });
});
