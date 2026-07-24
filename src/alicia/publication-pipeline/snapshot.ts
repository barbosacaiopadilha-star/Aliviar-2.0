import { buildIdempotencyKey, hashPayload } from "./hash";
import type { ImmutableSnapshot, PublicationDraft } from "./types";

export function createImmutableSnapshot(input: {
  draft: PublicationDraft;
  profileVersion: number;
  supersedesSnapshotId?: string | null;
  createdAt?: string;
}): ImmutableSnapshot {
  const contentHash = hashPayload(input.draft.payload);
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    snapshotId: `snap-${input.draft.doctorId}-v${input.profileVersion}-${contentHash.slice(0, 8)}`,
    doctorId: input.draft.doctorId,
    profileVersion: input.profileVersion,
    payload: structuredClone(input.draft.payload),
    deterministicHash: contentHash,
    protocolVersion: input.draft.protocolVersion,
    protocolDecisionId: input.draft.protocolDecisionId,
    evidenceReportId: input.draft.evidenceReportId,
    createdAt,
    publishedAt: null,
    supersedesSnapshotId: input.supersedesSnapshotId ?? null,
    idempotencyKey: buildIdempotencyKey({
      candidateId: input.draft.candidateId,
      protocolDecisionId: input.draft.protocolDecisionId,
      protocolVersion: input.draft.protocolVersion,
      contentHash,
    }),
  };
}

export function freezeSnapshot(snapshot: ImmutableSnapshot): ImmutableSnapshot {
  return Object.freeze(structuredClone(snapshot)) as ImmutableSnapshot;
}
