import { NextResponse } from "next/server";

import {
  buildPrimeiroPortalView,
  createVerticalSliceStack,
  getDemoPortalSession,
  registerPatientInStack,
  runPublicToPortalFlow,
  seedDemoPortalSession,
  signInPatient,
} from "@/vertical-slice";

const DEMO_USER_ID = "demo-patient-1";

async function ensureDemoSession() {
  const existing = getDemoPortalSession(DEMO_USER_ID);
  if (existing) return existing;

  const stack = await createVerticalSliceStack();
  const flow = await runPublicToPortalFlow(stack, {
    sessionId: "demo-visitor-session",
    patientFullName: "Maria Silva",
    patientPreferredName: "Maria",
    patientEmail: "maria@example.com",
    journeyTitle: "Jornada de Maria",
  });

  registerPatientInStack(stack, {
    userId: DEMO_USER_ID,
    email: "maria@example.com",
    patientId: flow.patientId,
    fullName: "Maria Silva",
    preferredName: "Maria",
  });

  const session = { userId: DEMO_USER_ID, flow };
  seedDemoPortalSession(session);
  return session;
}

export async function GET() {
  try {
    const demo = await ensureDemoSession();
    const stack = await createVerticalSliceStack();
    await signInPatient(stack, demo.userId);

    const view = await buildPrimeiroPortalView(stack, {
      handoffId: demo.flow.handoffId,
      journeyId: demo.flow.journeyId,
      patientId: demo.flow.patientId,
      actorId: demo.userId,
    });

    if (!view.ok) {
      return NextResponse.json({ message: view.error.message }, { status: 404 });
    }

    return NextResponse.json(view.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar portal.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
