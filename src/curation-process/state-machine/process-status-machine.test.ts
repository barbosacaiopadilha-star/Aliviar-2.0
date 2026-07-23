import { describe, expect, it } from "vitest";

import {
  assertProcessStatusTransition,
  canCancelProcess,
  canTransitionProcessStatus,
} from "./process-status-machine";

describe("process status machine", () => {
  it("permite fluxo completo até conclusão", () => {
    expect(canTransitionProcessStatus("CREATED", "INVESTIGATING")).toBe(true);
    expect(canTransitionProcessStatus("INVESTIGATING", "RESEARCHING")).toBe(true);
    expect(canTransitionProcessStatus("RESEARCHING", "COMPARING")).toBe(true);
    expect(canTransitionProcessStatus("COMPARING", "REVIEWING")).toBe(true);
    expect(canTransitionProcessStatus("REVIEWING", "READY_FOR_APPROVAL")).toBe(true);
    expect(canTransitionProcessStatus("READY_FOR_APPROVAL", "COMPLETED")).toBe(true);
  });

  it("permite cancelamento em etapas ativas", () => {
    expect(canTransitionProcessStatus("RESEARCHING", "CANCELLED")).toBe(true);
    expect(canCancelProcess("REVIEWING")).toBe(true);
    expect(canCancelProcess("COMPLETED")).toBe(false);
  });

  it("bloqueia transições inválidas", () => {
    expect(assertProcessStatusTransition("CREATED", "COMPLETED")).toMatch(/inválida/i);
    expect(assertProcessStatusTransition("COMPLETED", "REVIEWING")).toMatch(/inválida/i);
  });
});
