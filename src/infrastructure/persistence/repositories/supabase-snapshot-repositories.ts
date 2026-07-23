import { randomUUID } from "node:crypto";

import type { CaseRecord } from "@/case-registration/model/case";
import type { CaseRegistrationEvent } from "@/case-registration/events/case-registration-events";
import type { CaseRepositoryPort } from "@/case-registration/ports/case-registration-ports";
import type { JourneyHandoff } from "@/journey-handoff/model/journey-handoff";
import type { HandoffRepositoryPort } from "@/journey-handoff/ports/handoff-ports";
import type { CurationReportSnapshot } from "@/curation-report/model/curation-report";
import type { ReportVersion } from "@/curation-report/model/report-version";
import type {
  ReportRepositoryPort,
  ReportVersionRepositoryPort,
} from "@/curation-report/ports/curation-report-ports";
import type { JourneyKernelSnapshot } from "@/kernel/jornada/journey-kernel-aggregate";
import type { JourneyTransitionEvent } from "@/kernel/jornada/transition-events";
import type { JourneyKernelRepositoryPort } from "@/kernel/ports/kernel-ports";
import type { CurationProcessSnapshot } from "@/curation-process/model/curation-process";
import type { ProcessVersion } from "@/curation-process/model/process-version";
import type { ResearchSession } from "@/curation-process/model/research-session";
import type {
  ProcessRepositoryPort,
  ProcessVersionRepositoryPort,
  ResearchRepositoryPort,
} from "@/curation-process/ports/curation-process-ports";
import type { DeliveryAccess } from "@/report-delivery/model/delivery-access";
import type { DeliveryVersion } from "@/report-delivery/model/delivery-version";
import type { ReportDeliverySnapshot } from "@/report-delivery/model/report-delivery";
import type {
  DeliveryAccessRepositoryPort,
  DeliveryRepositoryPort,
  DeliveryVersionRepositoryPort,
} from "@/report-delivery/ports/report-delivery-ports";
import type { AttachmentReference } from "@/journey-memory/model/attachment-reference";
import type { MemoryNote } from "@/journey-memory/model/memory-note";
import type {
  AppendTimelineEntryInput,
  MemoryTimelineEntry,
} from "@/journey-memory/model/memory-timeline-entry";
import type {
  AttachmentReferenceRepositoryPort,
  NoteRepositoryPort,
  TimelineEntryRepositoryPort,
} from "@/journey-memory/ports/journey-memory-ports";

import { DOMAIN_COLLECTIONS } from "../collections";
import { DomainSnapshotStore } from "../domain-snapshot-store";

export class SupabaseCaseRepository implements CaseRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(record: CaseRecord, registrationEvents: CaseRegistrationEvent[]): Promise<CaseRecord> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.CASES,
      entityId: record.id,
      snapshot: record,
      journeyId: record.journeyId,
      patientId: record.patientId,
    });

    for (const event of registrationEvents) {
      await this.store.appendChild({
        collection: DOMAIN_COLLECTIONS.CASE_EVENTS,
        parentId: record.id,
        child: event,
        journeyId: record.journeyId,
        patientId: record.patientId,
      });
    }

    return record;
  }

  async findById(id: string): Promise<CaseRecord | null> {
    const row = await this.store.findById<CaseRecord>(DOMAIN_COLLECTIONS.CASES, id);
    return row?.snapshot ?? null;
  }

  async findByJourneyId(journeyId: string): Promise<CaseRecord | null> {
    const row = await this.store.findByJourneyId<CaseRecord>(DOMAIN_COLLECTIONS.CASES, journeyId);
    return row?.snapshot ?? null;
  }
}

export class SupabaseHandoffRepository implements HandoffRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(handoff: JourneyHandoff): Promise<JourneyHandoff> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.HANDOFFS,
      entityId: handoff.id,
      snapshot: handoff,
      lookupKey: handoff.sessionId,
      journeyId: handoff.bootstrap?.journeyId ?? null,
      patientId: handoff.bootstrap?.patientId ?? null,
    });
    return handoff;
  }

  async findById(id: string): Promise<JourneyHandoff | null> {
    const row = await this.store.findById<JourneyHandoff>(DOMAIN_COLLECTIONS.HANDOFFS, id);
    return row?.snapshot ?? null;
  }

  async findBySessionId(sessionId: string): Promise<JourneyHandoff | null> {
    const row = await this.store.findByLookupKey<JourneyHandoff>(DOMAIN_COLLECTIONS.HANDOFFS, sessionId);
    return row?.snapshot ?? null;
  }
}

export class SupabaseJourneyKernelRepository implements JourneyKernelRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(
    snapshot: JourneyKernelSnapshot,
    transitionEvents: readonly JourneyTransitionEvent[],
  ): Promise<JourneyKernelSnapshot> {
    const existing = await this.store.findById<JourneyKernelSnapshot>(
      DOMAIN_COLLECTIONS.JOURNEY_KERNEL,
      snapshot.id,
    );
    if (existing && existing.snapshot.version >= snapshot.version) {
      throw new Error("Conflito de versão ao salvar jornada.");
    }

    await this.store.save({
      collection: DOMAIN_COLLECTIONS.JOURNEY_KERNEL,
      entityId: snapshot.id,
      snapshot,
      journeyId: snapshot.id,
      patientId: snapshot.patientId,
      expectedVersion: existing?.version,
    });

    for (const event of transitionEvents) {
      await this.store.appendChild({
        collection: DOMAIN_COLLECTIONS.JOURNEY_TRANSITIONS,
        parentId: snapshot.id,
        child: event,
        journeyId: snapshot.id,
        patientId: snapshot.patientId,
      });
    }

    return snapshot;
  }

  async findById(id: string): Promise<JourneyKernelSnapshot | null> {
    const row = await this.store.findById<JourneyKernelSnapshot>(DOMAIN_COLLECTIONS.JOURNEY_KERNEL, id);
    return row?.snapshot ?? null;
  }

  async findByPatient(patientId: string): Promise<JourneyKernelSnapshot[]> {
    return this.store.listByParentId<JourneyKernelSnapshot>(
      DOMAIN_COLLECTIONS.JOURNEY_KERNEL,
      "patient_id",
      patientId,
    );
  }
}

export class SupabaseTimelineEntryRepository implements TimelineEntryRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async append(
    input: AppendTimelineEntryInput,
    recordedAt: string,
    id: string,
  ): Promise<MemoryTimelineEntry> {
    const entry: MemoryTimelineEntry = {
      id,
      journeyId: input.journeyId,
      kind: input.kind,
      category: input.category ?? null,
      source: input.source ?? "MEMORY",
      title: input.title,
      body: input.body ?? null,
      occurredAt: input.occurredAt,
      recordedAt,
      actorId: input.actorId,
      originId: input.originId ?? null,
    };

    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.MEMORY_TIMELINE,
      parentId: input.journeyId,
      child: entry,
      journeyId: input.journeyId,
    });

    return entry;
  }

  async listByJourney(journeyId: string): Promise<MemoryTimelineEntry[]> {
    return this.store.listByLookupPrefix<MemoryTimelineEntry>(
      DOMAIN_COLLECTIONS.MEMORY_TIMELINE,
      `${journeyId}:`,
    );
  }
}

export class SupabaseNoteRepository implements NoteRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(note: MemoryNote): Promise<MemoryNote> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.MEMORY_NOTES,
      parentId: note.journeyId,
      child: note,
      journeyId: note.journeyId,
    });
    return note;
  }

  async listByJourney(journeyId: string): Promise<MemoryNote[]> {
    return this.store.listByLookupPrefix<MemoryNote>(DOMAIN_COLLECTIONS.MEMORY_NOTES, `${journeyId}:`);
  }
}

export class SupabaseAttachmentReferenceRepository implements AttachmentReferenceRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(reference: AttachmentReference): Promise<AttachmentReference> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.MEMORY_ATTACHMENTS,
      parentId: reference.journeyId,
      child: reference,
      journeyId: reference.journeyId,
    });
    return reference;
  }

  async listByJourney(journeyId: string): Promise<AttachmentReference[]> {
    return this.store.listByLookupPrefix<AttachmentReference>(
      DOMAIN_COLLECTIONS.MEMORY_ATTACHMENTS,
      `${journeyId}:`,
    );
  }
}

export class SupabaseReportRepository implements ReportRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(snapshot: CurationReportSnapshot): Promise<CurationReportSnapshot> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.CURATION_REPORTS,
      entityId: snapshot.id,
      snapshot,
      journeyId: snapshot.journeyId,
      patientId: snapshot.patientId,
    });
    return snapshot;
  }

  async findById(reportId: string): Promise<CurationReportSnapshot | null> {
    const row = await this.store.findById<CurationReportSnapshot>(DOMAIN_COLLECTIONS.CURATION_REPORTS, reportId);
    return row?.snapshot ?? null;
  }

  async findByJourneyId(journeyId: string): Promise<CurationReportSnapshot | null> {
    const row = await this.store.findByJourneyId<CurationReportSnapshot>(
      DOMAIN_COLLECTIONS.CURATION_REPORTS,
      journeyId,
    );
    return row?.snapshot ?? null;
  }
}

export class SupabaseReportVersionRepository implements ReportVersionRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async append(reportId: string, version: ReportVersion): Promise<ReportVersion> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.CURATION_REPORT_VERSIONS,
      parentId: reportId,
      child: version,
    });
    return version;
  }

  async listByReportId(reportId: string): Promise<ReportVersion[]> {
    return this.store.listByLookupPrefix<ReportVersion>(
      DOMAIN_COLLECTIONS.CURATION_REPORT_VERSIONS,
      `${reportId}:`,
    );
  }
}

export class SupabaseProcessRepository implements ProcessRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(snapshot: CurationProcessSnapshot): Promise<CurationProcessSnapshot> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.CURATION_PROCESSES,
      entityId: snapshot.id,
      snapshot,
      journeyId: snapshot.journeyId,
      lookupKey: `${snapshot.reportId}:${snapshot.id}`,
    });
    return snapshot;
  }

  async findById(processId: string): Promise<CurationProcessSnapshot | null> {
    const row = await this.store.findById<CurationProcessSnapshot>(
      DOMAIN_COLLECTIONS.CURATION_PROCESSES,
      processId,
    );
    return row?.snapshot ?? null;
  }

  async findActiveByReportId(reportId: string): Promise<CurationProcessSnapshot | null> {
    const items = await this.store.listByLookupPrefix<CurationProcessSnapshot>(
      DOMAIN_COLLECTIONS.CURATION_PROCESSES,
      `${reportId}:`,
    );
    return items.find((item) => item.status !== "COMPLETED" && item.status !== "CANCELLED") ?? null;
  }

  async listByReportId(reportId: string): Promise<CurationProcessSnapshot[]> {
    return this.store.listByLookupPrefix<CurationProcessSnapshot>(
      DOMAIN_COLLECTIONS.CURATION_PROCESSES,
      `${reportId}:`,
    );
  }
}

export class SupabaseProcessVersionRepository implements ProcessVersionRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async append(processId: string, version: ProcessVersion): Promise<ProcessVersion> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.CURATION_PROCESS_VERSIONS,
      parentId: processId,
      child: version,
    });
    return version;
  }

  async listByProcessId(processId: string): Promise<ProcessVersion[]> {
    return this.store.listByLookupPrefix<ProcessVersion>(
      DOMAIN_COLLECTIONS.CURATION_PROCESS_VERSIONS,
      `${processId}:`,
    );
  }
}

export class SupabaseResearchRepository implements ResearchRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(session: ResearchSession): Promise<ResearchSession> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.CURATION_RESEARCH,
      entityId: session.id,
      snapshot: session,
      lookupKey: `${session.processId}:${session.id}`,
    });
    return session;
  }

  async findById(sessionId: string): Promise<ResearchSession | null> {
    const row = await this.store.findById<ResearchSession>(DOMAIN_COLLECTIONS.CURATION_RESEARCH, sessionId);
    return row?.snapshot ?? null;
  }

  async listByProcessId(processId: string): Promise<ResearchSession[]> {
    return this.store.listByLookupPrefix<ResearchSession>(
      DOMAIN_COLLECTIONS.CURATION_RESEARCH,
      `${processId}:`,
    );
  }
}

export class SupabaseDeliveryRepository implements DeliveryRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async save(snapshot: ReportDeliverySnapshot): Promise<ReportDeliverySnapshot> {
    await this.store.save({
      collection: DOMAIN_COLLECTIONS.REPORT_DELIVERIES,
      entityId: snapshot.id,
      snapshot,
      lookupKey: `${snapshot.reportId}:${snapshot.id}`,
    });
    return snapshot;
  }

  async findById(deliveryId: string): Promise<ReportDeliverySnapshot | null> {
    const row = await this.store.findById<ReportDeliverySnapshot>(
      DOMAIN_COLLECTIONS.REPORT_DELIVERIES,
      deliveryId,
    );
    return row?.snapshot ?? null;
  }

  async findActiveByReportAndVersion(
    reportId: string,
    reportVersion: number,
  ): Promise<ReportDeliverySnapshot | null> {
    const items = await this.store.listByLookupPrefix<ReportDeliverySnapshot>(
      DOMAIN_COLLECTIONS.REPORT_DELIVERIES,
      `${reportId}:`,
    );
    return (
      items.find(
        (item) => item.reportVersion === reportVersion && item.status !== "ARCHIVED",
      ) ?? null
    );
  }

  async listByReportId(reportId: string): Promise<ReportDeliverySnapshot[]> {
    return this.store.listByLookupPrefix<ReportDeliverySnapshot>(
      DOMAIN_COLLECTIONS.REPORT_DELIVERIES,
      `${reportId}:`,
    );
  }
}

export class SupabaseDeliveryAccessRepository implements DeliveryAccessRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async append(access: DeliveryAccess): Promise<DeliveryAccess> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.REPORT_DELIVERY_ACCESS,
      parentId: access.deliveryId,
      child: access,
    });
    return access;
  }

  async listByDeliveryId(deliveryId: string): Promise<DeliveryAccess[]> {
    return this.store.listByLookupPrefix<DeliveryAccess>(
      DOMAIN_COLLECTIONS.REPORT_DELIVERY_ACCESS,
      `${deliveryId}:`,
    );
  }
}

export class SupabaseDeliveryVersionRepository implements DeliveryVersionRepositoryPort {
  constructor(private readonly store: DomainSnapshotStore) {}

  async append(deliveryId: string, version: DeliveryVersion): Promise<DeliveryVersion> {
    await this.store.appendChild({
      collection: DOMAIN_COLLECTIONS.REPORT_DELIVERY_VERSIONS,
      parentId: deliveryId,
      child: version,
    });
    return version;
  }

  async listByDeliveryId(deliveryId: string): Promise<DeliveryVersion[]> {
    return this.store.listByLookupPrefix<DeliveryVersion>(
      DOMAIN_COLLECTIONS.REPORT_DELIVERY_VERSIONS,
      `${deliveryId}:`,
    );
  }
}
