import type { JourneyEventCategory, JourneyEventSource } from "@/modules/journey-events/types/journey-event";

export interface TimelineRecord {
  id: string;
  journeyId: string;
  category: JourneyEventCategory;
  source: JourneyEventSource;
  title: string;
  description: string | null;
  journeyImpact: string | null;
  nextStep: string | null;
  occurredAt: string;
  createdBy: string;
  createdAt: string;
  isCorrected: boolean;
  correctedEventId: string | null;
}

export interface AppendTimelineRecordInput {
  journeyId: string;
  category: JourneyEventCategory;
  source: JourneyEventSource;
  title: string;
  description?: string | null;
  journeyImpact?: string | null;
  nextStep?: string | null;
  occurredAt: string;
  createdBy: string;
}

export interface TimelineRepositoryPort {
  append(input: AppendTimelineRecordInput): Promise<TimelineRecord>;
  listByJourney(journeyId: string): Promise<TimelineRecord[]>;
  findById(id: string): Promise<TimelineRecord | null>;
}
