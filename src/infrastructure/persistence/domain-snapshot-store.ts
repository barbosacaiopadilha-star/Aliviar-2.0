import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DomainCollection } from "./collections";
import { PersistenceConcurrencyError } from "./concurrency-error";
import { logPersistenceQuery } from "./persistence-observability";

export interface SnapshotRow<T> {
  snapshot: T;
  version: number;
  journeyId: string | null;
  patientId: string | null;
}

interface SaveSnapshotInput<T> {
  collection: DomainCollection;
  entityId: string;
  snapshot: T;
  journeyId?: string | null;
  patientId?: string | null;
  lookupKey?: string | null;
  expectedVersion?: number;
}

export class DomainSnapshotStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById<T>(collection: DomainCollection, entityId: string): Promise<SnapshotRow<T> | null> {
    const started = performance.now();
    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .select("snapshot, version, journey_id, patient_id")
      .eq("collection", collection)
      .eq("entity_id", entityId)
      .maybeSingle();

    logPersistenceQuery({
      operation: "findById",
      collection,
      entityId,
      durationMs: Math.round(performance.now() - started),
      rowCount: data ? 1 : 0,
      errorCode: error?.code ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;

    return {
      snapshot: data.snapshot as T,
      version: data.version,
      journeyId: data.journey_id,
      patientId: data.patient_id,
    };
  }

  async findByLookupKey<T>(collection: DomainCollection, lookupKey: string): Promise<SnapshotRow<T> | null> {
    const started = performance.now();
    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .select("snapshot, version, journey_id, patient_id, entity_id")
      .eq("collection", collection)
      .eq("lookup_key", lookupKey)
      .maybeSingle();

    logPersistenceQuery({
      operation: "findByLookupKey",
      collection,
      durationMs: Math.round(performance.now() - started),
      rowCount: data ? 1 : 0,
      errorCode: error?.code ?? null,
    });

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      snapshot: data.snapshot as T,
      version: data.version,
      journeyId: data.journey_id,
      patientId: data.patient_id,
    };
  }

  async findByJourneyId<T>(collection: DomainCollection, journeyId: string): Promise<SnapshotRow<T> | null> {
    const started = performance.now();
    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .select("snapshot, version, journey_id, patient_id")
      .eq("collection", collection)
      .eq("journey_id", journeyId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    logPersistenceQuery({
      operation: "findByJourneyId",
      collection,
      journeyId,
      durationMs: Math.round(performance.now() - started),
      rowCount: data ? 1 : 0,
      errorCode: error?.code ?? null,
    });

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      snapshot: data.snapshot as T,
      version: data.version,
      journeyId: data.journey_id,
      patientId: data.patient_id,
    };
  }

  async listByParentId<T>(
    collection: DomainCollection,
    parentField: "journey_id" | "patient_id",
    parentId: string,
  ): Promise<T[]> {
    const started = performance.now();
    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .select("snapshot")
      .eq("collection", collection)
      .eq(parentField, parentId)
      .order("updated_at", { ascending: true });

    logPersistenceQuery({
      operation: "listByParentId",
      collection,
      journeyId: parentField === "journey_id" ? parentId : null,
      patientId: parentField === "patient_id" ? parentId : null,
      durationMs: Math.round(performance.now() - started),
      rowCount: data?.length ?? 0,
      errorCode: error?.code ?? null,
    });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.snapshot as T);
  }

  async listByLookupPrefix<T>(collection: DomainCollection, prefix: string): Promise<T[]> {
    const started = performance.now();
    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .select("snapshot")
      .eq("collection", collection)
      .like("lookup_key", `${prefix}%`)
      .order("updated_at", { ascending: true });

    logPersistenceQuery({
      operation: "listByLookupPrefix",
      collection,
      durationMs: Math.round(performance.now() - started),
      rowCount: data?.length ?? 0,
      errorCode: error?.code ?? null,
    });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.snapshot as T);
  }

  async save<T>(input: SaveSnapshotInput<T>): Promise<SnapshotRow<T>> {
    const started = performance.now();
    const existing = await this.findById<T>(input.collection, input.entityId);

    if (existing && input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
      throw new PersistenceConcurrencyError();
    }

    const nextVersion = existing ? existing.version + 1 : 1;
    const row = {
      collection: input.collection,
      entity_id: input.entityId,
      journey_id: input.journeyId ?? existing?.journeyId ?? null,
      patient_id: input.patientId ?? existing?.patientId ?? null,
      lookup_key: input.lookupKey ?? null,
      snapshot: input.snapshot,
      version: nextVersion,
    };

    const { data, error } = await this.supabase
      .from("domain_snapshots")
      .upsert(row, { onConflict: "collection,entity_id" })
      .select("snapshot, version, journey_id, patient_id")
      .single();

    logPersistenceQuery({
      operation: "save",
      collection: input.collection,
      entityId: input.entityId,
      journeyId: row.journey_id,
      patientId: row.patient_id,
      durationMs: Math.round(performance.now() - started),
      rowCount: data ? 1 : 0,
      errorCode: error?.code ?? null,
    });

    if (error || !data) {
      throw new Error(error?.message ?? "Falha ao persistir snapshot.");
    }

    return {
      snapshot: data.snapshot as T,
      version: data.version,
      journeyId: data.journey_id,
      patientId: data.patient_id,
    };
  }

  async appendChild<T>(input: {
    collection: DomainCollection;
    parentId: string;
    child: T;
    journeyId?: string | null;
    patientId?: string | null;
  }): Promise<T> {
    const entityId = randomUUID();
    await this.save({
      collection: input.collection,
      entityId,
      snapshot: input.child,
      lookupKey: `${input.parentId}:${entityId}`,
      journeyId: input.journeyId,
      patientId: input.patientId,
    });
    return input.child;
  }
}
