import { describe, expect, it } from "vitest";

import { allowedNextStatuses, isValidCaseTransition } from "@/modules/cases/state-machine";
import { CASE_STATUSES, TERMINAL_CASE_STATUSES } from "@/modules/cases/types";

describe("case state machine (ADR-019)", () => {
  it("permite a sequência operacional feliz completa", () => {
    expect(isValidCaseTransition("NEW", "IN_REVIEW")).toBe(true);
    expect(isValidCaseTransition("IN_REVIEW", "READY_FOR_CURATION")).toBe(true);
    expect(isValidCaseTransition("READY_FOR_CURATION", "IN_CURATION")).toBe(true);
    expect(isValidCaseTransition("IN_CURATION", "HUMAN_REVIEW")).toBe(true);
    expect(isValidCaseTransition("HUMAN_REVIEW", "DELIVERED")).toBe(true);
    expect(isValidCaseTransition("DELIVERED", "CLOSED")).toBe(true);
  });

  it("permite voltar de HUMAN_REVIEW para aguardar informação", () => {
    expect(isValidCaseTransition("HUMAN_REVIEW", "WAITING_FOR_INFORMATION")).toBe(true);
  });

  it("(Sprint 3) permite IN_CURATION -> WAITING_FOR_INFORMATION quando o CaseAudit do ACE bloqueia", () => {
    expect(isValidCaseTransition("IN_CURATION", "WAITING_FOR_INFORMATION")).toBe(true);
  });

  it("rejeita pular etapas (transição inválida)", () => {
    expect(isValidCaseTransition("NEW", "DELIVERED")).toBe(false);
    expect(isValidCaseTransition("NEW", "IN_CURATION")).toBe(false);
    expect(isValidCaseTransition("IN_REVIEW", "HUMAN_REVIEW")).toBe(false);
  });

  it("rejeita qualquer transição a partir de estados terminais", () => {
    for (const terminal of TERMINAL_CASE_STATUSES) {
      for (const status of CASE_STATUSES) {
        expect(isValidCaseTransition(terminal, status)).toBe(false);
      }
    }
  });

  it("allowedNextStatuses nunca inclui o próprio estado", () => {
    for (const status of CASE_STATUSES) {
      expect(allowedNextStatuses(status)).not.toContain(status);
    }
  });

  it("todo estado não-terminal permite cancelamento", () => {
    for (const status of CASE_STATUSES) {
      if (TERMINAL_CASE_STATUSES.includes(status) || status === "DELIVERED") continue;
      expect(allowedNextStatuses(status)).toContain("CANCELLED");
    }
  });
});
