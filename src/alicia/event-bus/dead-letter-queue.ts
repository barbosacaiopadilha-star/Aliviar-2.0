import type { DeadLetterItem, RetryableJob } from "./types";

export class DeadLetterQueue {
  private readonly items: DeadLetterItem[] = [];

  push(job: RetryableJob, reason: string): DeadLetterItem {
    const item: DeadLetterItem = {
      id: `dlq-${job.jobId}`,
      job: structuredClone(job),
      movedAt: new Date().toISOString(),
      reason,
    };
    this.items.push(item);
    return item;
  }

  list(): readonly DeadLetterItem[] {
    return [...this.items];
  }

  size(): number {
    return this.items.length;
  }
}

export const globalDeadLetterQueue = new DeadLetterQueue();
