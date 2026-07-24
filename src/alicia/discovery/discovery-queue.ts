import type { DiscoveryCandidate, DiscoveryQueueItem, DiscoveryQueueStatus } from "./types";

function queueItemId(candidateId: string): string {
  return `dq-${candidateId}`;
}

export class DiscoveryQueue {
  private readonly items = new Map<string, DiscoveryQueueItem>();

  enqueue(candidate: DiscoveryCandidate, status: DiscoveryQueueStatus): DiscoveryQueueItem {
    const existing = this.items.get(candidate.candidateId);
    if (existing) {
      const updated: DiscoveryQueueItem = {
        ...existing,
        candidate: {
          ...existing.candidate,
          fontesEncontradas: [
            ...new Set([...existing.candidate.fontesEncontradas, ...candidate.fontesEncontradas]),
          ],
          confidence: Math.max(existing.candidate.confidence, candidate.confidence),
        },
        status,
      };
      this.items.set(candidate.candidateId, updated);
      return updated;
    }

    const item: DiscoveryQueueItem = {
      queueId: queueItemId(candidate.candidateId),
      candidate,
      status,
      enqueuedAt: new Date().toISOString(),
    };
    this.items.set(candidate.candidateId, item);
    return item;
  }

  markDuplicate(candidate: DiscoveryCandidate, duplicateOf: string): DiscoveryQueueItem {
    const item: DiscoveryQueueItem = {
      queueId: queueItemId(`${candidate.candidateId}-dup-${Date.now()}`),
      candidate: { ...candidate, status: "DUPLICATE" },
      status: "DUPLICATE",
      enqueuedAt: new Date().toISOString(),
      duplicateOf,
    };
    this.items.set(item.queueId, item);
    return item;
  }

  markIgnored(candidate: DiscoveryCandidate): DiscoveryQueueItem {
    return this.enqueue({ ...candidate, status: "IGNORED" }, "IGNORED");
  }

  list(): DiscoveryQueueItem[] {
    return [...this.items.values()].sort((left, right) =>
      right.enqueuedAt.localeCompare(left.enqueuedAt),
    );
  }

  listByStatus(status: DiscoveryQueueStatus): DiscoveryQueueItem[] {
    return this.list().filter((item) => item.status === status);
  }

  size(): number {
    return this.items.size;
  }
}

export const globalDiscoveryQueue = new DiscoveryQueue();
