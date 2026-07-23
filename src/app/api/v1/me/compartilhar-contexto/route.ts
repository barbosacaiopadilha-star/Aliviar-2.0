import { NextResponse } from "next/server";

import {
  buildCompartilharContextoView,
  confirmHistoriaRecebida,
  sharePatientContext,
} from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET() {
  try {
    const { stack, userId, flow } = await getDemoApiRuntime();

    const patient = await stack.patientRepository.findById(flow.patientId);
    if (!patient) {
      return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
    }

    const view = await buildCompartilharContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
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
    const { stack, userId, flow } = await getDemoApiRuntime();

    const body = (await request.json()) as {
      observation?: string | null;
      document?: { name: string; where: string; note?: string | null } | null;
      reference?: { label: string; url: string } | null;
    };

    const shared = await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
      observation: body.observation,
      document: body.document,
      reference: body.reference,
    });

    if (!shared.ok) {
      return NextResponse.json({ message: shared.error.message }, { status: 400 });
    }

    const patient = await stack.patientRepository.findById(flow.patientId);
    const confirmed = await confirmHistoriaRecebida(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
      patientName: patient?.fullName ?? "Paciente",
    });

    if (!confirmed.ok) {
      return NextResponse.json({ message: confirmed.error.message }, { status: 400 });
    }

    const view = await buildCompartilharContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
      patientName: patient?.fullName ?? "Paciente",
    });

    if (!view.ok) {
      return NextResponse.json({ message: view.error.message }, { status: 404 });
    }

    return NextResponse.json({
      confirmationPath: shared.value.confirmationPath,
      sharedItems: shared.value.sharedItems,
      view: view.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao compartilhar contexto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
