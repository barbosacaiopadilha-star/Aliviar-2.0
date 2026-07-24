import type { PublicCatalogRecord } from "../types";
import type { ImmutableSnapshot } from "../types";

export type PublicationRepository = {
  stage(snapshot: ImmutableSnapshot): void;
  publish(snapshotId: string, publishedAt?: string): PublicCatalogRecord;
  findPublishedByDoctorId(doctorId: string): PublicCatalogRecord | undefined;
  findSnapshotById(snapshotId: string): ImmutableSnapshot | undefined;
  findByIdempotencyKey(key: string): ImmutableSnapshot | undefined;
  listHistory(doctorId: string): ImmutableSnapshot[];
  getActiveSnapshotId(doctorId: string): string | undefined;
  rollback(snapshotId: string): PublicCatalogRecord | undefined;
  listPublishedDoctorIds(): string[];
  listPublishedCrms(): string[];
  listPublishedCrmByDoctorId(): Map<string, string>;
};
