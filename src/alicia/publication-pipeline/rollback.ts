import type { PublicationRepository } from "./ports/publication-repository";
import type { PublicationAuditTrail } from "./audit";
import type { RollbackResult } from "./types";

export function executeRollback(input: {
  repository: PublicationRepository;
  audit: PublicationAuditTrail;
  snapshotId: string;
  doctorId: string;
  candidateId: string;
  protocolDecisionId: string;
  reason: string;
  actor?: string;
}): RollbackResult {
  const restored = input.repository.rollback(input.snapshotId);
  const incidentId = `inc-${Date.now()}`;

  input.audit.record({
    type: "ROLLBACK_EXECUTED",
    candidateId: input.candidateId,
    doctorId: input.doctorId,
    protocolDecisionId: input.protocolDecisionId,
    snapshotId: input.snapshotId,
    outcome: restored ? "success" : "no_previous_version",
    reasons: [input.reason, input.actor ? `actor:${input.actor}` : "actor:publication-pipeline"],
    evidenceIds: [],
  });

  return {
    success: Boolean(restored),
    restoredSnapshotId: restored ? input.repository.getActiveSnapshotId(input.doctorId) ?? null : null,
    removedSnapshotId: input.snapshotId,
    incidentId,
    message: restored
      ? "Rollback executado — versão anterior restaurada."
      : "Rollback removeu versão defeituosa — sem versão anterior.",
  };
}
