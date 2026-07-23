import { deliverReport } from "@/curation-report";
import { createDelivery, publishDelivery } from "@/report-delivery";
import {
  curationReportMutationDeps,
  reportDeliveryMutationDeps,
  runCurationLifecycle,
} from "@/system-integration";
import type { SystemIntegrationStack } from "@/system-integration/composition/system-integration-stack";
import {
  confirmHistoriaRecebida,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  sharePatientContext,
} from "@/vertical-slice";

import { getPatientPortalRuntime } from "./patient-portal-runtime";

export interface ReportReadingRuntime {
  stack: SystemIntegrationStack;
  userId: string;
  flow: { journeyId: string; patientId: string; handoffId: string };
}

async function ensurePublishedReport(stack: SystemIntegrationStack, input: {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
  curatorActorId: string;
  handoffId: string;
}): Promise<void> {
  const existingReport = await stack.reportRepository.findByJourneyId(input.journeyId);
  const existingDelivery = existingReport
    ? (await stack.deliveryRepository.listByReportId(existingReport.id)).find(
        (item) => item.status === "PUBLISHED",
      )
    : null;

  if (existingDelivery) {
    return;
  }

  await sharePatientContext(stack as never, {
    journeyId: input.journeyId,
    patientId: input.patientId,
    actorId: input.actorId,
    observation: "Histórico clínico compartilhado para curadoria.",
  });

  await confirmHistoriaRecebida(stack as never, {
    journeyId: input.journeyId,
    patientId: input.patientId,
    actorId: input.actorId,
    patientName: input.patientName,
  });

  await iniciarCuradoriaCaso(stack as never, {
    journeyId: input.journeyId,
    patientId: input.patientId,
    actorId: input.actorId,
    patientName: input.patientName,
  });

  await elaborarRelatorioCaso(stack as never, {
    journeyId: input.journeyId,
    patientId: input.patientId,
    actorId: input.actorId,
    patientName: input.patientName,
  });

  const curation = await runCurationLifecycle(stack, {
    journeyId: input.journeyId,
    handoffId: input.handoffId,
    curatorActorId: input.curatorActorId,
  });

  const deliveryDeps = reportDeliveryMutationDeps(stack);
  const created = await createDelivery(deliveryDeps, {
    reportId: curation.reportId,
    actorId: input.curatorActorId,
  });
  if (!created.ok) throw new Error(created.error.message);

  const published = await publishDelivery(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: input.curatorActorId,
  });
  if (!published.ok) throw new Error(published.error.message);

  const delivered = await deliverReport(curationReportMutationDeps(stack), {
    reportId: curation.reportId,
    actorId: input.curatorActorId,
  });
  if (!delivered.ok) throw new Error(delivered.error.message);
}

export async function getReportReadingRuntime(): Promise<ReportReadingRuntime> {
  const portal = await getPatientPortalRuntime();
  const stack = portal.stack as unknown as SystemIntegrationStack;

  const patient = await stack.patientRepository.findById(portal.flow.patientId);
  const patientName = patient?.fullName ?? "Paciente";

  await ensurePublishedReport(stack, {
    journeyId: portal.flow.journeyId,
    patientId: portal.flow.patientId,
    actorId: portal.userId,
    patientName,
    curatorActorId: "manager-profile-1",
    handoffId: portal.flow.handoffId,
  });

  return {
    stack,
    userId: portal.userId,
    flow: portal.flow,
  };
}
