import type { EvidenceHistoryEntry } from "./types";

export class EvidenceHistory {
  private readonly entries: EvidenceHistoryEntry[] = [];

  record(entry: EvidenceHistoryEntry): void {
    this.entries.push(entry);
  }

  list(): EvidenceHistoryEntry[] {
    return [...this.entries];
  }

  listByCandidate(candidateId: string): EvidenceHistoryEntry[] {
    return this.entries.filter((entry) => entry.candidateId === candidateId);
  }

  getLatest(candidateId: string): EvidenceHistoryEntry | null {
    const items = this.listByCandidate(candidateId);
    return items.length > 0 ? items[items.length - 1]! : null;
  }

  reset(): void {
    this.entries.length = 0;
  }
}
