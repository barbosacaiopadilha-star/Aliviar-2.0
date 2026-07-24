import { CRM_PATTERN } from "@/alicia/protocol-engine/constants";

import type { PublicationRepository } from "../ports/publication-repository";
import type { ImmutableSnapshot, PublicCatalogRecord } from "../types";

type PublishedEntry = {
  snapshotId: string;
  record: PublicCatalogRecord;
  crm: string;
};

export class InMemoryPublicationRepository implements PublicationRepository {
  private readonly staged = new Map<string, ImmutableSnapshot>();
  private readonly snapshots = new Map<string, ImmutableSnapshot>();
  private readonly published = new Map<string, PublishedEntry>();
  private readonly history = new Map<string, string[]>();
  private readonly idempotency = new Map<string, string>();

  stage(snapshot: ImmutableSnapshot): void {
    if (this.snapshots.has(snapshot.snapshotId) || this.staged.has(snapshot.snapshotId)) {
      throw new Error(`Snapshot ${snapshot.snapshotId} já existe e é imutável.`);
    }

    this.staged.set(snapshot.snapshotId, Object.freeze(structuredClone(snapshot)));
  }

  publish(snapshotId: string, publishedAt: string = new Date().toISOString()): PublicCatalogRecord {
    const staged = this.staged.get(snapshotId) ?? this.snapshots.get(snapshotId);
    if (!staged) {
      throw new Error(`Snapshot ${snapshotId} não encontrado para publicação.`);
    }

    const publishedSnapshot: ImmutableSnapshot = Object.freeze({
      ...structuredClone(staged),
      publishedAt,
    });

    this.snapshots.set(snapshotId, publishedSnapshot);
    this.staged.delete(snapshotId);
    this.idempotency.set(publishedSnapshot.idempotencyKey, snapshotId);

    const crm =
      publishedSnapshot.payload.transparency.sources
        .find((source) => CRM_PATTERN.test(source.name))
        ?.name.replace(/\s+/g, " ")
        .trim()
        .toLowerCase() ?? "";

    this.published.set(publishedSnapshot.doctorId, {
      snapshotId,
      record: structuredClone(publishedSnapshot.payload),
      crm,
    });

    const doctorHistory = this.history.get(publishedSnapshot.doctorId) ?? [];
    if (!doctorHistory.includes(snapshotId)) {
      doctorHistory.push(snapshotId);
      this.history.set(publishedSnapshot.doctorId, doctorHistory);
    }

    return structuredClone(publishedSnapshot.payload);
  }

  findPublishedByDoctorId(doctorId: string): PublicCatalogRecord | undefined {
    const entry = this.published.get(doctorId);
    return entry ? structuredClone(entry.record) : undefined;
  }

  findSnapshotById(snapshotId: string): ImmutableSnapshot | undefined {
    const snapshot = this.snapshots.get(snapshotId) ?? this.staged.get(snapshotId);
    return snapshot ? structuredClone(snapshot) : undefined;
  }

  findByIdempotencyKey(key: string): ImmutableSnapshot | undefined {
    const snapshotId = this.idempotency.get(key);
    return snapshotId ? this.findSnapshotById(snapshotId) : undefined;
  }

  listHistory(doctorId: string): ImmutableSnapshot[] {
    const ids = this.history.get(doctorId) ?? [];
    return ids
      .map((id) => this.findSnapshotById(id))
      .filter((snapshot): snapshot is ImmutableSnapshot => Boolean(snapshot));
  }

  getActiveSnapshotId(doctorId: string): string | undefined {
    return this.published.get(doctorId)?.snapshotId;
  }

  rollback(snapshotId: string): PublicCatalogRecord | undefined {
    const target = this.snapshots.get(snapshotId);
    if (!target) {
      return undefined;
    }

    const doctorId = target.doctorId;
    const history = this.history.get(doctorId) ?? [];
    const targetIndex = history.indexOf(snapshotId);
    const previousSnapshotId = targetIndex > 0 ? history[targetIndex - 1] : undefined;

    if (!previousSnapshotId) {
      this.published.delete(doctorId);
      return undefined;
    }

    const previous = this.snapshots.get(previousSnapshotId);
    if (!previous) {
      return undefined;
    }

    const crm =
      previous.payload.transparency.sources
        .find((source) => CRM_PATTERN.test(source.name))
        ?.name.replace(/\s+/g, " ")
        .trim()
        .toLowerCase() ?? "";

    this.published.set(doctorId, {
      snapshotId: previousSnapshotId,
      record: structuredClone(previous.payload),
      crm,
    });

    return structuredClone(previous.payload);
  }

  listPublishedDoctorIds(): string[] {
    return [...this.published.keys()];
  }

  listPublishedCrms(): string[] {
    return [...this.published.values()].map((entry) => entry.crm).filter(Boolean);
  }

  listPublishedCrmByDoctorId(): Map<string, string> {
    return new Map(
      [...this.published.entries()]
        .filter(([, entry]) => Boolean(entry.crm))
        .map(([doctorId, entry]) => [doctorId, entry.crm]),
    );
  }
}
