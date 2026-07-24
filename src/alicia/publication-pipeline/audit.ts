import { PROTOCOL_VERSION } from "./constants";
import type { PublicationAuditEvent, PublicationAuditEventType } from "./types";

function eventId(): string {
  return `pub-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class PublicationAuditTrail {
  private readonly events: PublicationAuditEvent[] = [];

  record(input: {
    type: PublicationAuditEventType;
    candidateId: string;
    doctorId: string;
    protocolDecisionId: string;
    publicationDraftId?: string;
    snapshotId?: string;
    outcome: string;
    reasons: string[];
    evidenceIds: string[];
    at?: string;
  }): PublicationAuditEvent {
    const event: PublicationAuditEvent = {
      id: eventId(),
      type: input.type,
      at: input.at ?? new Date().toISOString(),
      candidateId: input.candidateId,
      doctorId: input.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      publicationDraftId: input.publicationDraftId,
      snapshotId: input.snapshotId,
      protocolVersion: PROTOCOL_VERSION,
      outcome: input.outcome,
      reasons: input.reasons,
      evidenceIds: input.evidenceIds,
    };

    this.events.push(event);
    return event;
  }

  list(): readonly PublicationAuditEvent[] {
    return [...this.events];
  }

  listByDoctor(doctorId: string): readonly PublicationAuditEvent[] {
    return this.events.filter((event) => event.doctorId === doctorId);
  }
}

export const globalPublicationAuditTrail = new PublicationAuditTrail();
