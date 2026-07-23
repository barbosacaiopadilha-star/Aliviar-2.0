import { describe, expect, it } from "vitest";

import {
  canAdvance,
  canBlock,
  canResume,
  evaluateAdvance,
  evaluateAdvanceTo,
} from "./state-machine";
import type { OperationalStage } from "./operational-stage";

describe("journey state machine", () => {
  it("permite avan├ºo sequencial de CADASTRO at├® ENCERRADO", () => {
    let stage: OperationalStage = "CADASTRO";
    const stages: string[] = [stage];

    while (true) {
      const result = evaluateAdvance({
        currentStage: stage,
        isBlocked: false,
        isClosed: false,
      });
      if (!result.ok) break;
      stages.push(result.toStage);
      stage = result.toStage;
    }

    expect(stages).toEqual([
      "CADASTRO",
      "HISTORIA",
      "ACE",
      "CURADORIA",
      "ENTREGA",
      "ESCOLHA",
      "ACOMPANHAMENTO",
      "RELACIONAMENTO",
      "ENCERRADO",
    ]);
  });

  it("rejeita avan├ºo quando bloqueada", () => {
    const result = evaluateAdvance({
      currentStage: "HISTORIA",
      isBlocked: true,
      isClosed: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("JOURNEY_BLOCKED");
    }
  });

  it("rejeita avan├ºo quando encerrada", () => {
    const result = evaluateAdvance({
      currentStage: "ENCERRADO",
      isBlocked: false,
      isClosed: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("JOURNEY_CLOSED");
    }
  });

  it("rejeita salto de etapas", () => {
    const result = evaluateAdvanceTo(
      { currentStage: "CADASTRO", isBlocked: false, isClosed: false },
      "ACE",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("SKIP_NOT_ALLOWED");
    }
  });

  it("rejeita retrocesso", () => {
    const result = evaluateAdvanceTo(
      { currentStage: "CURADORIA", isBlocked: false, isClosed: false },
      "HISTORIA",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_TRANSITION");
    }
  });

  it("bloqueio e retomada respeitam estado", () => {
    expect(
      canBlock({ currentStage: "ACE", isBlocked: false, isClosed: false }),
    ).toBe(true);
    expect(
      canBlock({ currentStage: "ACE", isBlocked: true, isClosed: false }),
    ).toBe(false);
    expect(
      canResume({ currentStage: "ACE", isBlocked: true, isClosed: false }),
    ).toBe(true);
    expect(
      canResume({ currentStage: "ACE", isBlocked: false, isClosed: false }),
    ).toBe(false);
    expect(canAdvance({ currentStage: "ENCERRADO", isBlocked: false, isClosed: true })).toBe(
      false,
    );
  });
});
