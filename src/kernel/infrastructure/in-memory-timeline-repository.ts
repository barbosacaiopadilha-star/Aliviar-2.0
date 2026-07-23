import { randomUUID } from "node:crypto";

import type {
  AppendTimelineRecordInput,
  TimelineRecord,
  TimelineRepositoryPort,
} from "../events/timeline-record";

export class InMemoryTimelineRepository implements TimelineRepositoryPort {
  private readonly records = new Map<string, TimelineRecord>();

  async append(input: AppendTimelineRecordInput): Promise<TimelineRecord> {
    const now = new Date().toISOString();
    const record: TimelineRecord = {
      id: randomUUID(),
      journeyId: input.journeyId,
      category: input.category,
      source: input.source,
      title: input.title,
      description: input.description ?? null,
      journeyImpact: input.journeyImpact ?? null,
      nextStep: input.nextStep ?? null,
      occurredAt: input.occurredAt,
      createdBy: input.createdBy,
      createdAt: now,
      isCorrected: false,
      correctedEventId: null,
    };

    this.records.set(record.id, record);
    return record;
  }

  async listByJourney(journeyId: string): Promise<TimelineRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.journeyId === journeyId)
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  async findById(id: string): Promise<TimelineRecord | null> {
    return this.records.get(id) ?? null;
  }
}
