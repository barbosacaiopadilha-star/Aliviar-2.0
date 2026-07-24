import type { VerificationHistoryEntry } from "./types";

function historyId(): string {
  return `vh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class VerificationHistory {
  private readonly entries: VerificationHistoryEntry[] = [];

  append(entry: Omit<VerificationHistoryEntry, "id">): VerificationHistoryEntry {
    const stored: VerificationHistoryEntry = { ...entry, id: historyId() };
    this.entries.push(stored);
    return stored;
  }

  list(): VerificationHistoryEntry[] {
    return [...this.entries];
  }

  listByProfile(profileId: string): VerificationHistoryEntry[] {
    return this.entries.filter((entry) => entry.profileId === profileId);
  }

  listPendingReview(): VerificationHistoryEntry[] {
    return this.entries.filter(
      (entry) =>
        entry.decision === "REVIEW_REQUIRED" || entry.decision === "UNPUBLISH_RECOMMENDED",
    );
  }

  recent(limit = 20): VerificationHistoryEntry[] {
    return this.entries.slice(-limit).reverse();
  }

  size(): number {
    return this.entries.length;
  }

  reset(): void {
    this.entries.length = 0;
  }
}
