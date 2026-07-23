import type { BootstrapJourneyInput, JourneyBootstrapResult } from "../model/bootstrap-result";
import type { JourneyHandoff } from "../model/journey-handoff";
import type {
  ClockPort,
  HandoffRepositoryPort,
  IdGeneratorPort,
  JourneyBootstrapPort,
} from "../ports/handoff-ports";

export class FixedClock implements ClockPort {
  constructor(private readonly fixedIso: string) {}

  now(): string {
    return this.fixedIso;
  }
}

export class SequentialIdGenerator implements IdGeneratorPort {
  constructor(private counter = 1, private readonly prefix = "handoff") {}

  nextId(): string {
    const id = `${this.prefix}-${this.counter}`;
    this.counter += 1;
    return id;
  }
}

export class InMemoryHandoffRepository implements HandoffRepositoryPort {
  private readonly byId = new Map<string, JourneyHandoff>();
  private readonly bySession = new Map<string, string>();

  async save(handoff: JourneyHandoff): Promise<JourneyHandoff> {
    this.byId.set(handoff.id, handoff);
    this.bySession.set(handoff.sessionId, handoff.id);
    return handoff;
  }

  async findById(id: string): Promise<JourneyHandoff | null> {
    return this.byId.get(id) ?? null;
  }

  async findBySessionId(sessionId: string): Promise<JourneyHandoff | null> {
    const id = this.bySession.get(sessionId);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }
}

export class InMemoryJourneyBootstrapPort implements JourneyBootstrapPort {
  constructor(private readonly idGenerator: IdGeneratorPort, private readonly clock: ClockPort) {}

  async bootstrap(input: BootstrapJourneyInput): Promise<JourneyBootstrapResult> {
    return {
      caseId: this.idGenerator.nextId(),
      patientId: this.idGenerator.nextId(),
      journeyId: this.idGenerator.nextId(),
      ownership: {
        managerId: input.managerId ?? null,
        assignedCuratorId: null,
      },
      bootstrappedAt: this.clock.now(),
    };
  }
}

export interface InMemoryHandoffStack {
  clock: FixedClock;
  idGenerator: SequentialIdGenerator;
  handoffRepository: InMemoryHandoffRepository;
  bootstrapPort: InMemoryJourneyBootstrapPort;
}

export function createInMemoryHandoffStack(
  fixedIso = "2026-07-22T12:00:00.000Z",
): InMemoryHandoffStack {
  const clock = new FixedClock(fixedIso);
  const idGenerator = new SequentialIdGenerator();
  return {
    clock,
    idGenerator,
    handoffRepository: new InMemoryHandoffRepository(),
    bootstrapPort: new InMemoryJourneyBootstrapPort(idGenerator, clock),
  };
}
