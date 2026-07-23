import {
  confirmHistoriaRecebida,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

import type { SystemIntegrationStack } from "../composition/system-integration-stack";
import { closeJourneyAfterReading } from "./close-journey-after-reading";
import { runCurationLifecycle } from "./run-curation-lifecycle";
import { runDeliveryLifecycle } from "./run-delivery-lifecycle";
import { buildPlatformJourneyProjection } from "../projections/platform-journey-projection";

export interface RunFullPlatformFlowInput {
  sessionId: string;
  patientFullName: string;
  patientPreferredName: string;
  patientEmail: string;
  journeyTitle: string;
  patientUserId: string;
  curatorActorId: string;
}

export interface RunFullPlatformFlowResult {
  handoffId: string;
  journeyId: string;
  patientId: string;
  reportId: string;
  processId: string;
  deliveryId: string;
  finalProjection: Awaited<ReturnType<typeof buildPlatformJourneyProjection>>;
}

export async function runFullPlatformFlow(
  stack: SystemIntegrationStack,
  input: RunFullPlatformFlowInput,
): Promise<RunFullPlatformFlowResult> {
  const bootstrapped = await runPublicToPortalFlow(stack, {
    sessionId: input.sessionId,
    patientFullName: input.patientFullName,
    patientPreferredName: input.patientPreferredName,
    patientEmail: input.patientEmail,
    journeyTitle: input.journeyTitle,
  });

  registerPatientInStack(stack, {
    userId: input.patientUserId,
    email: input.patientEmail,
    patientId: bootstrapped.patientId,
    fullName: input.patientFullName,
    preferredName: input.patientPreferredName,
  });
  await signInPatient(stack, input.patientUserId);

  await sharePatientContext(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    actorId: input.patientUserId,
    observation: "História clínica compartilhada pelo paciente.",
  });

  await confirmHistoriaRecebida(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    actorId: input.patientUserId,
    patientName: input.patientFullName,
  });

  await iniciarCuradoriaCaso(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    actorId: input.patientUserId,
    patientName: input.patientFullName,
  });

  await elaborarRelatorioCaso(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    actorId: input.patientUserId,
    patientName: input.patientFullName,
  });

  const curation = await runCurationLifecycle(stack, {
    journeyId: bootstrapped.journeyId,
    handoffId: bootstrapped.handoffId,
    curatorActorId: input.curatorActorId,
  });

  const delivery = await runDeliveryLifecycle(stack, {
    reportId: curation.reportId,
    curatorActorId: input.curatorActorId,
    patientActorId: input.patientUserId,
  });

  await closeJourneyAfterReading(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    patientActorId: input.patientUserId,
  });

  const finalProjection = await buildPlatformJourneyProjection(stack, {
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    actorId: input.patientUserId,
  });

  return {
    handoffId: bootstrapped.handoffId,
    journeyId: bootstrapped.journeyId,
    patientId: bootstrapped.patientId,
    reportId: curation.reportId,
    processId: curation.processId,
    deliveryId: delivery.deliveryId,
    finalProjection,
  };
}
