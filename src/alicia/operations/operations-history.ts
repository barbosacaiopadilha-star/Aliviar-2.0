import type { DailyOperationsSnapshot } from "./types";
import { todayDateKey } from "./utils";

/**
 * Histórico append-only — snapshots diários nunca são apagados.
 */
export class OperationsHistory {
  private readonly snapshots: DailyOperationsSnapshot[] = [];

  record(snapshot: DailyOperationsSnapshot): void {
    const existing = this.snapshots.findIndex((s) => s.date === snapshot.date);
    if (existing >= 0) {
      this.snapshots[existing] = snapshot;
    } else {
      this.snapshots.push(snapshot);
    }
  }

  list(): DailyOperationsSnapshot[] {
    return [...this.snapshots];
  }

  getByDate(date: string): DailyOperationsSnapshot | null {
    return this.snapshots.find((s) => s.date === date) ?? null;
  }

  getToday(): DailyOperationsSnapshot | null {
    return this.getByDate(todayDateKey());
  }

  get size(): number {
    return this.snapshots.length;
  }
}
