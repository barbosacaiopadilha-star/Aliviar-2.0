import type { JourneyKernelSnapshot } from "../jornada/journey-kernel-aggregate";
import type { JourneyTransitionEvent } from "../jornada/transition-events";
import type { JourneyKernelRepositoryPort } from "../ports/kernel-ports";

export class InMemoryJourneyKernelRepository implements JourneyKernelRepositoryPort {
  private readonly snapshots = new Map<string, JourneyKernelSnapshot>();
  private readonly transitionLog = new Map<string, JourneyTransitionEvent[]>();

  async save(
    snapshot: JourneyKernelSnapshot,
    transitionEvents: readonly JourneyTransitionEvent[],
  ): Promise<JourneyKernelSnapshot> {
    const existing = this.snapshots.get(snapshot.id);
    if (existing && existing.version >= snapshot.version) {
      throw new Error("Conflito de vers├úo ao salvar jornada.");
    }

    this.snapshots.set(snapshot.id, snapshot);

    if (transitionEvents.length > 0) {
      const current = this.transitionLog.get(snapshot.id) ?? [];
      this.transitionLog.set(snapshot.id, [...current, ...transitionEvents]);
    }

    return snapshot;
  }

  async findById(id: string): Promise<JourneyKernelSnapshot | null> {
    return this.snapshots.get(id) ?? null;
  }

  async findByPatient(patientId: string): Promise<JourneyKernelSnapshot[]> {
    return [...this.snapshots.values()].filter((snapshot) => snapshot.patientId === patientId);
  }

  listTransitionEvents(journeyId: string): JourneyTransitionEvent[] {
    return [...(this.transitionLog.get(journeyId) ?? [])];
  }
}
