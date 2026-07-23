import { NextResponse } from "next/server";

import { iniciarCuradoriaCaso } from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET() {
  try {
    const { stack, userId, flow } = await getDemoApiRuntime();

    const patient = await stack.patientRepository.findById(flow.patientId);
    if (!patient) {
      return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
    }

    const started = await iniciarCuradoriaCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
      patientName: patient.fullName,
    });

    if (!started.ok) {
      return NextResponse.json({ message: started.error.message }, { status: 400 });
    }

    return NextResponse.json(started.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar curadoria.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
