import type { FactorySchedule } from "./types";
import { SCHEDULE_INTERVALS_MS } from "./constants";

export class FactoryScheduler {
  private schedule: FactorySchedule = "ON_DEMAND";
  private lastRunAt: string | null = null;

  setSchedule(schedule: FactorySchedule): void {
    this.schedule = schedule;
  }

  getSchedule(): FactorySchedule {
    return this.schedule;
  }

  recordRun(at: string): void {
    this.lastRunAt = at;
  }

  isDue(now = Date.now()): boolean {
    if (this.schedule === "MANUAL") {
      return false;
    }

    if (this.schedule === "ON_DEMAND") {
      return true;
    }

    if (!this.lastRunAt) {
      return true;
    }

    const interval = SCHEDULE_INTERVALS_MS[this.schedule] ?? 0;
    if (interval === 0) {
      return true;
    }

    return now - new Date(this.lastRunAt).getTime() >= interval;
  }

  getNextRunAt(): string | null {
    if (this.schedule === "MANUAL" || this.schedule === "ON_DEMAND") {
      return null;
    }

    if (!this.lastRunAt) {
      return new Date().toISOString();
    }

    const interval = SCHEDULE_INTERVALS_MS[this.schedule] ?? 0;
    return new Date(new Date(this.lastRunAt).getTime() + interval).toISOString();
  }

  getLastRunAt(): string | null {
    return this.lastRunAt;
  }
}
