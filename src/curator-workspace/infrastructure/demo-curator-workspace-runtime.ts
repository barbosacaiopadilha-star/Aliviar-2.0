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

import {
  createCuratorWorkspaceStack,
  type CuratorWorkspaceStack,
} from "../composition/curator-workspace-stack";
import type { PublicToPortalFlowResult } from "@/vertical-slice/services/run-public-to-portal-flow";

export const DEMO_CURATOR_ID = "manager-profile-1";
export const DEMO_PATIENT_USER_ID = "demo-patient-1";

let demoStack: CuratorWorkspaceStack | null = null;

export interface DemoCuratorWorkspaceRuntime {
  stack: CuratorWorkspaceStack;
  flow: PublicToPortalFlowResult;
  curatorActorId: string;
}

async function bootstrapPatientFlow(stack: CuratorWorkspaceStack): Promise<PublicToPortalFlowResult> {
  let session = getDemoPortalSession(DEMO_PATIENT_USER_ID);
  if (!session) {
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "demo-curator-workspace",
      patientFullName: "Maria Silva",
      patientPreferredName: "Maria",
      patientEmail: "maria@example.com",
      journeyTitle: "Jornada de Maria",
    });

    registerPatientInStack(stack, {
      userId: DEMO_PATIENT_USER_ID,
      email: "maria@example.com",
      patientId: flow.patientId,
      fullName: "Maria Silva",
      preferredName: "Maria",
    });

    session = { userId: DEMO_PATIENT_USER_ID, flow };
    seedDemoPortalSession(session);
  }

  await signInPatient(stack, session.userId);

  await sharePatientContext(stack, {
    journeyId: session.flow.journeyId,
    patientId: session.flow.patientId,
    actorId: session.userId,
    observation: "Histórico de dor crônica com exames anteriores.",
    document: { name: "Ressonância", where: "Prontuário digital" },
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

  return session.flow;
}

export async function getDemoCuratorWorkspaceRuntime(): Promise<DemoCuratorWorkspaceRuntime> {
  assertDemoRuntimeAllowed(DEMO_MODE_FLAGS.CURATOR_DEMO_MODE);

  if (!demoStack) {
    demoStack = await createCuratorWorkspaceStack();
  }

  const flow = await bootstrapPatientFlow(demoStack);

  return {
    stack: demoStack,
    flow,
    curatorActorId: DEMO_CURATOR_ID,
  };
}

export function resetDemoCuratorWorkspaceRuntime(): void {
  demoStack = null;
}
