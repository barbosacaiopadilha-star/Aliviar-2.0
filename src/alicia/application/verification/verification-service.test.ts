import { describe, expect, it } from "vitest";

import {
  getVerificationSummary,
  isPendingVerification,
  isVerified,
} from "@/alicia/application/verification/verification-service";
import type { Verification } from "@/alicia/domain/verification";

const verification: Verification = {
  id: "verification-test",
  origin: "CRM-SP",
  recordedAt: "2026-01-01",
  status: "verified",
  lastVerifiedAt: "2026-02-01",
  confidence: "high",
};

describe("verification service", () => {
  it("detects verified status", () => {
    expect(isVerified(verification)).toBe(true);
    expect(isPendingVerification(verification)).toBe(false);
  });

  it("builds summary text", () => {
    expect(getVerificationSummary(verification)).toContain("Verificado");
  });

  it("builds pending summary text", () => {
    const pending = { ...verification, status: "pending" as const, lastVerifiedAt: null };
    expect(isPendingVerification(pending)).toBe(true);
    expect(getVerificationSummary(pending)).toContain("Em verificação");
  });
});
