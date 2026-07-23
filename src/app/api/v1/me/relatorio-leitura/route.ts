import { NextResponse } from "next/server";

import {
  confirmReportReading,
  getDemoReportReadingRuntime,
  openReportReading,
} from "@/product-experience/report-reading";

export async function GET() {
  try {
    const { stack, userId, flow } = await getDemoReportReadingRuntime();

    const opened = await openReportReading(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
    });

    if (!opened.ok) {
      const status = opened.error.code === "UNAVAILABLE" ? 409 : 404;
      return NextResponse.json({ message: opened.error.message }, { status });
    }

    return NextResponse.json(opened.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao abrir relatório.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { stack, userId, flow } = await getDemoReportReadingRuntime();

    const confirmed = await confirmReportReading(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: userId,
    });

    if (!confirmed.ok) {
      const status = confirmed.error.code === "UNAVAILABLE" ? 409 : 400;
      return NextResponse.json({ message: confirmed.error.message }, { status });
    }

    return NextResponse.json(confirmed.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar leitura.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
