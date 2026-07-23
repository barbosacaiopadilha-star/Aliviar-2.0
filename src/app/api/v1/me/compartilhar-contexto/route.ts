import { NextResponse } from "next/server";

import {
  buildCompartilharContextoView,
  createVerticalSliceStack,
  getDemoPortalSession,
  runPublicToPortalFlow,
  registerPatientInStack,
  seedDemoPortalSession,
  sharePatientContext,
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

    const patient = await stack.patientRepository.findById(demo.flow.patientId);
    if (!patient) {
      return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
    }

    const view = await buildCompartilharContextoView(stack, {
      journeyId: demo.flow.journeyId,
      patientId: demo.flow.patientId,
      actorId: demo.userId,
      patientName: patient.fullName,
    });

    if (!view.ok) {
      return NextResponse.json({ message: view.error.message }, { status: 404 });
    }

    return NextResponse.json(view.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar compartilhamento.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const demo = await ensureDemoSession();
    const stack = await createVerticalSliceStack();
    await signInPatient(stack, demo.userId);

    const body = (await request.json()) as {
      observation?: string | null;
      document?: { name: string; where: string; note?: string | null } | null;
      reference?: { label: string; url: string } | null;
    };

    const shared = await sharePatientContext(stack, {
      journeyId: demo.flow.journeyId,
      patientId: demo.flow.patientId,
      actorId: demo.userId,
      observation: body.observation,
      document: body.document,
      reference: body.reference,
    });

    if (!shared.ok) {
      return NextResponse.json({ message: shared.error.message }, { status: 400 });
    }

    const patient = await stack.patientRepository.findById(demo.flow.patientId);
    const view = await buildCompartilharContextoView(stack, {
      journeyId: demo.flow.journeyId,
      patientId: demo.flow.patientId,
      actorId: demo.userId,
      patientName: patient?.fullName ?? "Paciente",
    });

    if (!view.ok) {
      return NextResponse.json({ message: view.error.message }, { status: 404 });
    }

    return NextResponse.json({
      acknowledgement: shared.value.acknowledgement,
      sharedItems: shared.value.sharedItems,
      view: view.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao compartilhar contexto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
