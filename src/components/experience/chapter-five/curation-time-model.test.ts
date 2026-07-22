import { describe, expect, it } from "vitest";

import { CURATION_HOST } from "../chapter-four/curation-model";
import {
  buildCurationTimeLines,
  calendarDaysBetween,
  resolveCurationTimePhase,
} from "./curation-time-model";

describe("curation-time-model", () => {
  it("resolve fases pelo tempo calendário, sem contador visível", () => {
    expect(resolveCurationTimePhase(0)).toBe("return_same_day");
    expect(resolveCurationTimePhase(1)).toBe("early_days");
    expect(resolveCurationTimePhase(3)).toBe("deepening");
    expect(resolveCurationTimePhase(7)).toBe("sustained");
  });

  it("calcula dias entre datas por calendário", () => {
    const start = new Date(2026, 6, 20);
    const nextDay = new Date(2026, 6, 21);
    const weekLater = new Date(2026, 6, 27);

    expect(calendarDaysBetween(start, start)).toBe(0);
    expect(calendarDaysBetween(start, nextDay)).toBe(1);
    expect(calendarDaysBetween(start, weekLater)).toBe(7);
  });

  it("transmite companhia contínua em cada fase", () => {
    const phases = ["return_same_day", "early_days", "deepening", "sustained"] as const;

    for (const phase of phases) {
      const lines = buildCurationTimeLines(phase);
      const text = lines.map((line) => line.text).join(" ").toLowerCase();

      expect(lines.some((line) => line.text.includes(CURATION_HOST))).toBe(true);
      expect(text).toMatch(/seguimos|cuidando|acompanhado|mãos|seu caso/);
    }
  });

  it("não usa linguagem de status, contador ou abandono", () => {
    const phases = ["return_same_day", "early_days", "deepening", "sustained"] as const;
    const text = phases
      .flatMap((phase) => buildCurationTimeLines(phase))
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).not.toContain("aguarde");
    expect(text).not.toContain("status");
    expect(text).not.toContain("%");
    expect(text).not.toContain("checklist");
    expect(text).not.toContain("processo está parado");
    expect(text).not.toMatch(/\d+\s*dias/);
  });
});
