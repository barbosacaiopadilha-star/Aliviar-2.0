import {
  createVerticalSliceStack,
  registerPatientInStack,
  signInPatient,
} from "../composition/vertical-slice-stack";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { runPublicToPortalFlow } from "../services/run-public-to-portal-flow";
import type { PublicToPortalFlowResult } from "../services/run-public-to-portal-flow";
import { getDemoPortalSession, seedDemoPortalSession } from "./demo-portal-store";

export const DEMO_USER_ID = "demo-patient-1";

let demoStack: VerticalSliceStack | null = null;

export interface DemoApiRuntime {
  stack: VerticalSliceStack;
  userId: string;
  flow: PublicToPortalFlowResult;
}

export async function getDemoApiRuntime(): Promise<DemoApiRuntime> {
  if (!demoStack) {
    demoStack = await createVerticalSliceStack();
  }

  let session = getDemoPortalSession(DEMO_USER_ID);
  if (!session) {
    const flow = await runPublicToPortalFlow(demoStack, {
      sessionId: "demo-visitor-session",
      patientFullName: "Maria Silva",
      patientPreferredName: "Maria",
      patientEmail: "maria@example.com",
      journeyTitle: "Jornada de Maria",
    });

    registerPatientInStack(demoStack, {
      userId: DEMO_USER_ID,
      email: "maria@example.com",
      patientId: flow.patientId,
      fullName: "Maria Silva",
      preferredName: "Maria",
    });

    session = { userId: DEMO_USER_ID, flow };
    seedDemoPortalSession(session);
  }

  await signInPatient(demoStack, session.userId);

  return {
    stack: demoStack,
    userId: session.userId,
    flow: session.flow,
  };
}

export function resetDemoApiRuntime(): void {
  demoStack = null;
}
