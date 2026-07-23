import type { JourneyKernelSnapshot } from "../jornada/journey-kernel-aggregate";
import type { JourneyTransitionEvent } from "../jornada/transition-events";

export interface JourneyKernelRepositoryPort {
  save(
    snapshot: JourneyKernelSnapshot,
    transitionEvents: readonly JourneyTransitionEvent[],
  ): Promise<JourneyKernelSnapshot>;
  findById(id: string): Promise<JourneyKernelSnapshot | null>;
  findByPatient(patientId: string): Promise<JourneyKernelSnapshot[]>;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface ClockPort {
  now(): string;
}
