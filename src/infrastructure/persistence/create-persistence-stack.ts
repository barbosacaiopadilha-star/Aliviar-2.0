import type { SupabaseClient } from "@supabase/supabase-js";

import { HandoffCaseBootstrapAdapter } from "@/vertical-slice/adapters/handoff-case-bootstrap-adapter";
import {
  VerticalSliceCaseLookup,
  VerticalSliceJourneyLookup,
  VerticalSlicePatientLookup,
} from "@/curator-workspace/adapters/curation-report-lookups";
import {
  VerticalSliceReportDeliveryLookup,
  VerticalSliceReportProcessLookup,
} from "@/system-integration/adapters/report-lookup-adapters";
import {
  createAuthorizationService,
  resolveSessionContext,
  type AuthorizationService,
} from "@/identity";
import type { Identity } from "@/identity/model/identity";
import type { JourneyRecord } from "@/identity/projection/journey-scope";
import {
  PermissiveMemoryAccess,
  InMemoryCommitmentSource,
} from "@/journey-memory/infrastructure/in-memory-repositories";
import { InMemoryTimelineRepository } from "@/kernel";
import type { KernelActor } from "@/kernel/rbac/authorization";

import { DomainSnapshotStore } from "./domain-snapshot-store";
import { SystemClock, UuidGenerator } from "./persistence-clocks";
import {
  SessionIdentityAuthProvider,
  StaticJourneyScopePort,
} from "./session-auth-provider";
import { SupabasePatientRepository } from "./repositories/supabase-patient-repository";
import {
  SupabaseAttachmentReferenceRepository,
  SupabaseCaseRepository,
  SupabaseDeliveryAccessRepository,
  SupabaseDeliveryRepository,
  SupabaseDeliveryVersionRepository,
  SupabaseHandoffRepository,
  SupabaseJourneyKernelRepository,
  SupabaseNoteRepository,
  SupabaseProcessRepository,
  SupabaseProcessVersionRepository,
  SupabaseReportRepository,
  SupabaseReportVersionRepository,
  SupabaseResearchRepository,
  SupabaseTimelineEntryRepository,
} from "./repositories/supabase-snapshot-repositories";

export interface PersistenceStackContext {
  patientId?: string;
  journeyId?: string;
  patientIdentity?: Identity;
  staffIdentity?: Identity;
  email?: string | null;
  defaultManagerId?: string;
}

export interface PersistenceStack {
  clock: SystemClock;
  ids: UuidGenerator;
  auth: SessionIdentityAuthProvider;
  authorization: AuthorizationService;
  journeyScope: StaticJourneyScopePort;
  journeyCatalog: JourneyRecord[];
  caseRepository: SupabaseCaseRepository;
  patientRepository: SupabasePatientRepository;
  journeyRepository: SupabaseJourneyKernelRepository;
  timelineRepository: InMemoryTimelineRepository;
  commitmentRepository: InMemoryCommitmentSource;
  memory: {
    clock: SystemClock;
    idGenerator: UuidGenerator;
    timelineRepository: SupabaseTimelineEntryRepository;
    noteRepository: SupabaseNoteRepository;
    attachmentRepository: SupabaseAttachmentReferenceRepository;
    commitmentSource: InMemoryCommitmentSource;
    access: PermissiveMemoryAccess;
  };
  handoff: {
    clock: SystemClock;
    idGenerator: UuidGenerator;
    handoffRepository: SupabaseHandoffRepository;
    bootstrapPort: HandoffCaseBootstrapAdapter;
  };
  bootstrapPort: HandoffCaseBootstrapAdapter;
  reportRepository: SupabaseReportRepository;
  versionRepository: SupabaseReportVersionRepository;
  caseLookup: VerticalSliceCaseLookup;
  journeyLookup: VerticalSliceJourneyLookup;
  patientLookup: VerticalSlicePatientLookup;
  processRepository: SupabaseProcessRepository;
  processVersionRepository: SupabaseProcessVersionRepository;
  researchRepository: SupabaseResearchRepository;
  deliveryRepository: SupabaseDeliveryRepository;
  deliveryAccessRepository: SupabaseDeliveryAccessRepository;
  deliveryVersionRepository: SupabaseDeliveryVersionRepository;
  reportProcessLookup: VerticalSliceReportProcessLookup;
  reportDeliveryLookup: VerticalSliceReportDeliveryLookup;
}

export async function createPersistenceStack(
  supabase: SupabaseClient,
  context: PersistenceStackContext,
): Promise<PersistenceStack> {
  const store = new DomainSnapshotStore(supabase);
  const clock = new SystemClock();
  const ids = new UuidGenerator();

  const identity =
    context.patientIdentity ??
    context.staffIdentity ??
    ({
      userId: "system",
      role: "MANAGER",
      isActive: true,
      staffProfileId: context.defaultManagerId ?? "manager-profile-1",
      displayName: "Sistema",
    } satisfies Identity);

  const journeyCatalog: JourneyRecord[] = context.journeyId
    ? [{ id: context.journeyId, patientId: context.patientId ?? "", assignedCuratorId: null, teamId: null }]
    : [];

  const auth = new SessionIdentityAuthProvider(identity, context.email ?? null);
  const journeyScope = new StaticJourneyScopePort(journeyCatalog);
  const session = await auth.resolveSession();
  const resolvedIdentity = await auth.resolveIdentity(session);
  const staffContext = await resolveSessionContext({
    authProvider: auth,
    journeyScopePort: journeyScope,
  });
  const authorization = createAuthorizationService(staffContext);

  const patientRepository = new SupabasePatientRepository(supabase);
  const caseRepository = new SupabaseCaseRepository(store);
  const journeyRepository = new SupabaseJourneyKernelRepository(store);
  const timelineRepository = new InMemoryTimelineRepository();
  const commitmentRepository = new InMemoryCommitmentSource();

  const systemActor: KernelActor = {
    id: context.defaultManagerId ?? "manager-profile-1",
    role: "MANAGER",
  };

  const bootstrapPort = new HandoffCaseBootstrapAdapter({
    caseRepository,
    patientRepository,
    journeyRepository,
    timelineRepository,
    ids,
    clock,
    authorization,
    systemActor,
    defaultManagerId: context.defaultManagerId ?? "manager-profile-1",
  });

  const handoffRepository = new SupabaseHandoffRepository(store);
  const memoryTimelineRepository = new SupabaseTimelineEntryRepository(store);

  const reportRepository = new SupabaseReportRepository(store);
  const versionRepository = new SupabaseReportVersionRepository(store);

  const processRepository = new SupabaseProcessRepository(store);
  const processVersionRepository = new SupabaseProcessVersionRepository(store);
  const researchRepository = new SupabaseResearchRepository(store);

  const deliveryRepository = new SupabaseDeliveryRepository(store);
  const deliveryAccessRepository = new SupabaseDeliveryAccessRepository(store);
  const deliveryVersionRepository = new SupabaseDeliveryVersionRepository(store);

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
    memory: {
      clock,
      idGenerator: ids,
      timelineRepository: memoryTimelineRepository,
      noteRepository: new SupabaseNoteRepository(store),
      attachmentRepository: new SupabaseAttachmentReferenceRepository(store),
      commitmentSource: commitmentRepository,
      access: new PermissiveMemoryAccess(),
    },
    handoff: {
      clock,
      idGenerator: ids,
      handoffRepository,
      bootstrapPort,
    },
    bootstrapPort,
    reportRepository,
    versionRepository,
    caseLookup: new VerticalSliceCaseLookup(caseRepository),
    journeyLookup: new VerticalSliceJourneyLookup(journeyRepository),
    patientLookup: new VerticalSlicePatientLookup(patientRepository),
    processRepository,
    processVersionRepository,
    researchRepository,
    deliveryRepository,
    deliveryAccessRepository,
    deliveryVersionRepository,
    reportProcessLookup: new VerticalSliceReportProcessLookup(reportRepository),
    reportDeliveryLookup: new VerticalSliceReportDeliveryLookup(reportRepository),
  };
}

export async function refreshPersistenceAuthorization(stack: PersistenceStack): Promise<void> {
  const session = await stack.auth.resolveSession();
  await stack.auth.resolveIdentity(session);
  const staffContext = await resolveSessionContext({
    authProvider: stack.auth,
    journeyScopePort: stack.journeyScope,
  });
  stack.authorization = createAuthorizationService(staffContext);
}
