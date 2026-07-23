import { NextResponse } from "next/server";

import { buildHistoriaRecebidaView } from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET() {
  try {
    const { stack, userId, flow } = await getDemoApiRuntime();

    const patient = await stack.patientRepository.findById(flow.patientId);
    if (!patient) {
      return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
    }

    const view = await buildHistoriaRecebidaView(stack, {
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
    const message = error instanceof Error ? error.message : "Erro ao carregar confirmação.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
