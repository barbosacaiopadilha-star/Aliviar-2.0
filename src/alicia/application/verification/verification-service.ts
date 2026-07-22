import type { Verification } from "@/alicia/domain/verification";

export function isVerified(verification: Verification): boolean {
  return verification.status === "verified";
}

export function isPendingVerification(verification: Verification): boolean {
  return verification.status === "pending";
}

export function getVerificationSummary(verification: Verification): string {
  if (isVerified(verification)) {
    return `Verificado em ${verification.lastVerifiedAt ?? verification.recordedAt} com confiança ${verification.confidence}.`;
  }

  return `Em verificação desde ${verification.recordedAt}.`;
}
