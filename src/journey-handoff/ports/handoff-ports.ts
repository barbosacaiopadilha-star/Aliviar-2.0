import type { JourneyHandoff } from "../model/journey-handoff";
import type { BootstrapJourneyInput, JourneyBootstrapResult } from "../model/bootstrap-result";

export interface ClockPort {
  now(): string;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface HandoffRepositoryPort {
  save(handoff: JourneyHandoff): Promise<JourneyHandoff>;
  findById(id: string): Promise<JourneyHandoff | null>;
  findBySessionId(sessionId: string): Promise<JourneyHandoff | null>;
}

export interface JourneyBootstrapPort {
  bootstrap(input: BootstrapJourneyInput): Promise<JourneyBootstrapResult>;
}
