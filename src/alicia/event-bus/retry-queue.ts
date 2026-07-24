import { DEFAULT_MAX_RETRY_ATTEMPTS } from "./constants";
import { DeadLetterQueue } from "./dead-letter-queue";
import type { EventBusMetrics } from "./metrics";
import type { DomainEvent, EventHandler, RetryableJob, RetryStatus } from "./types";

function jobId(): string {
  return `retry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RetryQueue {
  private readonly jobs = new Map<string, RetryableJob>();
  private readonly handlers = new Map<string, EventHandler>();

  constructor(
    private readonly dlq: DeadLetterQueue,
    private readonly metrics: EventBusMetrics,
    private readonly maxAttempts: number = DEFAULT_MAX_RETRY_ATTEMPTS,
  ) {}

  registerHandler(name: string, handler: EventHandler): void {
    this.handlers.set(name, handler);
  }

  enqueue(event: DomainEvent, handlerName: string): RetryableJob {
    const now = new Date().toISOString();
    const job: RetryableJob = {
      jobId: jobId(),
      event,
      handlerName,
      status: "Pending",
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.jobId, job);
    return job;
  }

  list(): RetryableJob[] {
    return [...this.jobs.values()].sort((left, right) =>
      left.updatedAt.localeCompare(right.updatedAt),
    );
  }

  listByStatus(status: RetryStatus): RetryableJob[] {
    return this.list().filter((job) => job.status === status);
  }

  async processPending(): Promise<void> {
    const pending = this.list().filter(
      (job) => job.status === "Pending" || job.status === "Retrying",
    );

    for (const job of pending) {
      await this.processJob(job.jobId);
    }
  }

  async processJob(jobIdValue: string): Promise<RetryStatus> {
    const job = this.jobs.get(jobIdValue);
    if (!job) {
      return "Failed";
    }

    const handler = this.handlers.get(job.handlerName);
    if (!handler) {
      job.status = "Failed";
      job.lastError = `Handler ${job.handlerName} não registrado.`;
      job.updatedAt = new Date().toISOString();
      this.dlq.push(job, job.lastError);
      this.metrics.recordDlq();
      return "DeadLetter";
    }

    job.status = "Processing";
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();

    try {
      await handler(job.event);
      job.status = "Succeeded";
      job.updatedAt = new Date().toISOString();
      return "Succeeded";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida.";
      job.lastError = message;
      job.updatedAt = new Date().toISOString();

      if (job.attempts >= job.maxAttempts) {
        job.status = "DeadLetter";
        this.dlq.push(job, message);
        this.metrics.recordDlq();
        return "DeadLetter";
      }

      job.status = "Retrying";
      this.metrics.recordRetry();
      return "Retrying";
    }
  }
}
