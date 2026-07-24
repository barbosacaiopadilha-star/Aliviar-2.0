import { hashPayload } from "./hash";
import type { PublicationRepository } from "./ports/publication-repository";
import type { ImmutableSnapshot } from "./types";

export function publishSnapshotAtomically(
  repository: PublicationRepository,
  snapshot: ImmutableSnapshot,
): { snapshotId: string; record: ImmutableSnapshot["payload"] } {
  const existing = repository.findSnapshotById(snapshot.snapshotId);
  if (!existing) {
    repository.stage(snapshot);
  }

  const publishedRecord = repository.publish(snapshot.snapshotId);
  const publishedSnapshot = repository.findSnapshotById(snapshot.snapshotId);

  if (!publishedSnapshot?.publishedAt) {
    throw new Error("Publicação falhou — snapshot sem publishedAt.");
  }

  if (hashPayload(publishedRecord) !== snapshot.deterministicHash) {
    repository.rollback(snapshot.snapshotId);
    throw new Error("Publicação inconsistente — rollback automático executado.");
  }

  return {
    snapshotId: snapshot.snapshotId,
    record: publishedRecord,
  };
}
