import { deliverReport } from "@/curation-report";
import { createDelivery, publishDelivery } from "@/report-delivery";
import {
  createSystemIntegrationStack,
  curationReportMutationDeps,
  reportDeliveryMutationDeps,
  runCurationLifecycle,
  type SystemIntegrationStack,
} from "@/system-integration";
import {
  confirmHistoriaRecebida,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";
import { assertDemoRuntimeAllowed, DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import { getDemoPortalSession, seedDemoPortalSession } from "@/vertical-slice/infrastructure/demo-portal-store";
import type { PublicToPortalFlowResult } from "@/vertical-slice/services/run-public-to-portal-flow";

export const DEMO_REPORT_READING_USER_ID = "demo-report-reading-1";
export const DEMO_REPORT_READING_CURATOR_ID = "manager-profile-1";

let demoStack: SystemIntegrationStack | null = null;

export interface DemoReportReadingRuntime {
  stack: SystemIntegrationStack;
  userId: string;
  flow: PublicToPortalFlowResult;
}

async function bootstrapPublishedReport(stack: SystemIntegrationStack): Promise<PublicToPortalFlowResult> {
  let session = getDemoPortalSession(DEMO_REPORT_READING_USER_ID);
  if (!session) {
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "demo-report-reading",
      patientFullName: "Maria Silva",
      patientPreferredName: "Maria",
      patientEmail: "maria@example.com",
      journeyTitle: "Jornada de Maria",
    });

    registerPatientInStack(stack, {
      userId: DEMO_REPORT_READING_USER_ID,
      email: "maria@example.com",
      patientId: flow.patientId,
      fullName: "Maria Silva",
      preferredName: "Maria",
    });

    session = { userId: DEMO_REPORT_READING_USER_ID, flow };
    seedDemoPortalSession(session);
  }

  await signInPatient(stack, session.userId);

  const existingReport = await stack.reportRepository.findByJourneyId(session.flow.journeyId);
  const existingDelivery = existingReport
    ? (await stack.deliveryRepository.listByReportId(existingReport.id)).find(
        (item) => item.status === "PUBLISHED",
      )
    : null;

  if (existingDelivery) {
    return session.flow;
  }

  await sharePatientContext(stack, {
    journeyId: session.flow.journeyId,
    patientId: session.flow.patientId,
    actorId: session.userId,
    observation: "Histórico clínico compartilhado para curadoria.",
  });

  await confirmHistoriaRecebida(stack, {
    journeyId: session.flow.journeyId,
    patientId: session.flow.patientId,
    actorId: session.userId,
    patientName: "Maria Silva",
  });

  await iniciarCuradoriaCaso(stack, {
    journeyId: session.flow.journeyId,
    patientId: session.flow.patientId,
    actorId: session.userId,
    patientName: "Maria Silva",
  });

  await elaborarRelatorioCaso(stack, {
    journeyId: session.flow.journeyId,
    patientId: session.flow.patientId,
    actorId: session.userId,
    patientName: "Maria Silva",
  });

  const curation = await runCurationLifecycle(stack, {
    journeyId: session.flow.journeyId,
    handoffId: session.flow.handoffId,
    curatorActorId: DEMO_REPORT_READING_CURATOR_ID,
  });

  const deliveryDeps = reportDeliveryMutationDeps(stack);
  const created = await createDelivery(deliveryDeps, {
    reportId: curation.reportId,
    actorId: DEMO_REPORT_READING_CURATOR_ID,
  });
  if (!created.ok) throw new Error(created.error.message);

  const published = await publishDelivery(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: DEMO_REPORT_READING_CURATOR_ID,
  });
  if (!published.ok) throw new Error(published.error.message);

  const delivered = await deliverReport(curationReportMutationDeps(stack), {
    reportId: curation.reportId,
    actorId: DEMO_REPORT_READING_CURATOR_ID,
  });
  if (!delivered.ok) throw new Error(delivered.error.message);

  return session.flow;
}

export async function getDemoReportReadingRuntime(): Promise<DemoReportReadingRuntime> {
  assertDemoRuntimeAllowed(DEMO_MODE_FLAGS.REPORT_DEMO_MODE);

  if (!demoStack) {
    demoStack = await createSystemIntegrationStack();
  }

  const flow = await bootstrapPublishedReport(demoStack);

  return {
    stack: demoStack,
    userId: DEMO_REPORT_READING_USER_ID,
    flow,
  };
}

export function resetDemoReportReadingRuntime(): void {
  demoStack = null;
}
