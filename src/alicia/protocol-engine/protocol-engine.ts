import { AuditTrail, globalAuditTrail } from "./audit-trail";
import { evaluateEvidence } from "./evidence-evaluator";
import { decidePublication } from "./publication-decision";
import type { DoctorCandidate, Evidence, PublicationDecision } from "./types";

export type ProtocolEngineOptions = {
  auditTrail?: AuditTrail;
  recordAudit?: boolean;
};

/**
 * Orquestrador do Protocol Engine — ponto de entrada único.
 */
export class ProtocolEngine {
  private readonly auditTrail: AuditTrail;
  private readonly recordAudit: boolean;

  constructor(options: ProtocolEngineOptions = {}) {
    this.auditTrail = options.auditTrail ?? globalAuditTrail;
    this.recordAudit = options.recordAudit ?? true;
  }

  evaluate(
    candidate: DoctorCandidate,
    evidence: Evidence[],
  ): PublicationDecision {
    const evidenceReport = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, evidenceReport);

    if (this.recordAudit) {
      this.auditTrail.record(
        candidate.id,
        candidate.caseId,
        decision,
        evidence.map((item) => item.id),
      );
    }

    return decision;
  }

  getAuditTrail(): AuditTrail {
    return this.auditTrail;
  }
}

export const defaultProtocolEngine = new ProtocolEngine();

export function evaluateCandidate(
  candidate: DoctorCandidate,
  evidence: Evidence[],
  options?: ProtocolEngineOptions,
): PublicationDecision {
  const engine = options ? new ProtocolEngine(options) : defaultProtocolEngine;
  return engine.evaluate(candidate, evidence);
}
