import { randomUUID } from "node:crypto";

import {
  InMemoryCaseRepository,
  InMemoryPatientRepository,
} from "@/case-registration/infrastructure/in-memory-repositories";
import {
  AuthorizationService,
  InMemoryAuthProvider,
  InMemoryJourneyScopePort,
  createAuthorizationService,
  resolveSessionContext,
} from "@/identity";
import type { Identity } from "@/identity/model/identity";
import type { JourneyRecord } from "@/identity/projection/journey-scope";
import {
  InMemoryCommitmentRepository,
  InMemoryJourneyKernelRepository,
  InMemoryTimelineRepository,
} from "@/kernel";
import { createInMemoryJourneyMemoryStack } from "@/journey-memory";
import { createInMemoryHandoffStack } from "@/journey-handoff";
import type { ClockPort, IdGeneratorPort } from "@/kernel/ports/kernel-ports";

import { HandoffCaseBootstrapAdapter } from "../adapters/handoff-case-bootstrap-adapter";

class VerticalSliceIdGenerator implements IdGeneratorPort {
  nextId(): string {
    return randomUUID();
  }
}

class VerticalSliceClock implements ClockPort {
  constructor(private readonly fixedIso = "2026-07-22T12:00:00.000Z") {}

  now(): string {
    return this.fixedIso;
  }
}

export interface VerticalSliceStack {
  clock: VerticalSliceClock;
  ids: VerticalSliceIdGenerator;
  auth: InMemoryAuthProvider;
  authorization: AuthorizationService;
  journeyScope: InMemoryJourneyScopePort;
  journeyCatalog: JourneyRecord[];
  caseRepository: InMemoryCaseRepository;
  patientRepository: InMemoryPatientRepository;
  journeyRepository: InMemoryJourneyKernelRepository;
  timelineRepository: InMemoryTimelineRepository;
  commitmentRepository: InMemoryCommitmentRepository;
  memory: ReturnType<typeof createInMemoryJourneyMemoryStack>;
  handoff: ReturnType<typeof createInMemoryHandoffStack>;
  bootstrapPort: HandoffCaseBootstrapAdapter;
}

export async function createVerticalSliceStack(
  fixedIso = "2026-07-22T12:00:00.000Z",
): Promise<VerticalSliceStack> {
  const clock = new VerticalSliceClock(fixedIso);
  const ids = new VerticalSliceIdGenerator();
  const auth = new InMemoryAuthProvider("supabase");
  const journeyCatalog: JourneyRecord[] = [];
  const journeyScope = new InMemoryJourneyScopePort(journeyCatalog);
  const caseRepository = new InMemoryCaseRepository();
  const patientRepository = new InMemoryPatientRepository();
  const journeyRepository = new InMemoryJourneyKernelRepository();
  const timelineRepository = new InMemoryTimelineRepository();
  const commitmentRepository = new InMemoryCommitmentRepository();
  const memory = createInMemoryJourneyMemoryStack(fixedIso);
  const handoff = createInMemoryHandoffStack(fixedIso);

  const staffIdentity: Identity = {
    userId: "manager-1",
    role: "MANAGER",
    isActive: true,
    staffProfileId: "manager-profile-1",
    displayName: "Gestor",
  };
  auth.register({
    id: staffIdentity.userId,
    email: "manager@aliviar.com",
    identity: staffIdentity,
  });
  auth.signIn(staffIdentity.userId);

  const staffContext = await resolveSessionContext({
    authProvider: auth,
    journeyScopePort: journeyScope,
  });
  const authorization = createAuthorizationService(staffContext);

  const kernelDeps = {
    journeyRepository,
    timelineRepository,
    ids,
    clock,
    caseRepository,
    patientRepository,
    authorization,
  };

  const bootstrapPort = new HandoffCaseBootstrapAdapter({
    ...kernelDeps,
    systemActor: { id: "manager-profile-1", role: "MANAGER" },
    defaultManagerId: "manager-profile-1",
  });

  return {
    clock,
    ids,
    auth,
    authorization,
    journeyScope,
    journeyCatalog,
    caseRepository,
    patientRepository,
    journeyRepository,
    timelineRepository,
    commitmentRepository,
    memory,
    handoff,
    bootstrapPort,
  };
}

export function registerPatientInStack(
  stack: VerticalSliceStack,
  params: { userId: string; email: string; patientId: string; fullName: string; preferredName: string },
): void {
  const identity: Identity = {
    userId: params.userId,
    role: "PATIENT",
    isActive: true,
    patientId: params.patientId,
    displayName: params.preferredName,
  };

  stack.auth.register({
    id: params.userId,
    email: params.email,
    identity,
  });
}

export function registerJourneyInCatalog(stack: VerticalSliceStack, journey: JourneyRecord): void {
  const existing = stack.journeyCatalog.findIndex((item) => item.id === journey.id);
  if (existing >= 0) {
    stack.journeyCatalog[existing] = journey;
    return;
  }
  stack.journeyCatalog.push(journey);
}

export async function signInPatient(stack: VerticalSliceStack, userId: string): Promise<void> {
  stack.auth.signIn(userId);
  const context = await resolveSessionContext({
    authProvider: stack.auth,
    journeyScopePort: stack.journeyScope,
  });
  stack.authorization = createAuthorizationService(context);
}
