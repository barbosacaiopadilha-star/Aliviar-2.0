import { STAGE_EVENT_MAP } from "./constants";
import type {
  OperationalTimeline,
  PipelineStageId,
  TimelineStage,
} from "./types";

type EventInput = {
  eventType: string;
  aggregateId: string;
  timestamp: string;
  correlationId: string;
  source: string;
};

function stageForEvent(eventType: string): PipelineStageId | null {
  for (const [stage, events] of Object.entries(STAGE_EVENT_MAP)) {
    if ((events as readonly string[]).includes(eventType)) {
      return stage as PipelineStageId;
    }
  }
  return null;
}

export class OperationalTimelineBuilder {
  build(events: EventInput[], limit = 10): OperationalTimeline[] {
    const byCorrelation = new Map<string, EventInput[]>();

    for (const event of events) {
      const list = byCorrelation.get(event.correlationId) ?? [];
      list.push(event);
      byCorrelation.set(event.correlationId, list);
    }

    const timelines: OperationalTimeline[] = [];

    for (const [correlationId, correlationEvents] of byCorrelation) {
      const sorted = [...correlationEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const stageMap = new Map<PipelineStageId, TimelineStage>();

      for (const event of sorted) {
        const stage = stageForEvent(event.eventType);
        if (!stage) {
          continue;
        }

        const existing = stageMap.get(stage);
        const timelineEvent = {
          eventType: event.eventType,
          timestamp: event.timestamp,
          aggregateId: event.aggregateId,
          source: event.source,
        };

        if (existing) {
          existing.events.push(timelineEvent);
        } else {
          stageMap.set(stage, { stage, events: [timelineEvent] });
        }
      }

      const stages = [...stageMap.values()];
      for (const stage of stages) {
        if (stage.events.length >= 2) {
          const first = new Date(stage.events[0]!.timestamp).getTime();
          const last = new Date(stage.events[stage.events.length - 1]!.timestamp).getTime();
          stage.durationMs = last - first;
        }
      }

      const startedAt = sorted[0]?.timestamp ?? new Date().toISOString();
      const completedAt = sorted[sorted.length - 1]?.timestamp ?? null;
      const totalDurationMs =
        completedAt && startedAt
          ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
          : 0;

      timelines.push({
        correlationId,
        candidateId: sorted.find((e) => e.aggregateId.startsWith("disc-"))?.aggregateId,
        stages,
        totalDurationMs,
        startedAt,
        completedAt,
      });
    }

    return timelines
      .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
      .slice(0, limit);
  }
}
