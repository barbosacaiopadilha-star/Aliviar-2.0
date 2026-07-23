import { describe, expect, it } from "vitest";

import {
  assertReportStatusTransition,
  canTransitionReportStatus,
  isReportEditable,
} from "../state-machine/report-status-machine";

describe("report status machine", () => {
  it("permite apenas transições válidas", () => {
    expect(canTransitionReportStatus("DRAFT", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionReportStatus("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionReportStatus("APPROVED", "DELIVERED")).toBe(true);
    expect(canTransitionReportStatus("DELIVERED", "ARCHIVED")).toBe(true);
    expect(canTransitionReportStatus("DRAFT", "APPROVED")).toBe(false);
    expect(canTransitionReportStatus("DRAFT", "DELIVERED")).toBe(false);
    expect(canTransitionReportStatus("ARCHIVED", "DRAFT")).toBe(false);
  });

  it("rejeita saltos inválidos com mensagem", () => {
    expect(assertReportStatusTransition("DRAFT", "DELIVERED")).toContain("inválida");
  });

  it("define editabilidade apenas em rascunho e revisão", () => {
    expect(isReportEditable("DRAFT")).toBe(true);
    expect(isReportEditable("UNDER_REVIEW")).toBe(true);
    expect(isReportEditable("APPROVED")).toBe(false);
    expect(isReportEditable("DELIVERED")).toBe(false);
    expect(isReportEditable("ARCHIVED")).toBe(false);
  });
});
