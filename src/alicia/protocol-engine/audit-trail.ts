import { PROTOCOL_VERSION } from "./constants";
import type { AuditEntry, PublicationDecision } from "./types";

function auditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Trilha de auditoria append-only — nunca remove entradas.
 */
export class AuditTrail {
  private readonly entries: AuditEntry[] = [];

  record(
    candidateId: string,
    caseId: string,
    decision: PublicationDecision,
    evidenceIds: string[],
    at: string = new Date().toISOString(),
  ): AuditEntry {
    const entry: AuditEntry = {
      id: auditId(),
      at,
      protocolVersion: PROTOCOL_VERSION,
      candidateId,
      caseId,
      decision: decision.outcome,
      eligibility: decision.eligibility.outcome,
      suggestedNivel: decision.suggestedNivel,
      rulesExecuted: [
        ...decision.satisfiedRules,
        ...decision.pendingRules,
        ...decision.failedRules,
      ],
      evidenceIds,
    };

    this.entries.push(entry);
    return entry;
  }

  list(): readonly AuditEntry[] {
    return [...this.entries];
  }

  listByCandidate(candidateId: string): readonly AuditEntry[] {
    return this.entries.filter((entry) => entry.candidateId === candidateId);
  }

  get size(): number {
    return this.entries.length;
  }
}

export const globalAuditTrail = new AuditTrail();
