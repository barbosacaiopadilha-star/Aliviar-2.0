import { registerReadConfirmation } from "@/report-delivery";
import {
  closeJourneyAfterReading,
  reportDeliveryMutationDeps,
  type SystemIntegrationStack,
} from "@/system-integration";

import { buildReportReadingView } from "../projections/build-report-reading-view";
import type { ReportReadingView } from "../model/report-reading-view";

export interface ConfirmReportReadingInput {
  journeyId: string;
  patientId: string;
  actorId: string;
}

export type ConfirmReportReadingResult =
  | { ok: true; value: ReportReadingView }
  | { ok: false; error: { code: "NOT_FOUND" | "UNAVAILABLE" | "DOMAIN_ERROR"; message: string } };

export async function confirmReportReading(
  stack: SystemIntegrationStack,
  input: ConfirmReportReadingInput,
): Promise<ConfirmReportReadingResult> {
  const current = await buildReportReadingView(stack, input);
  if (!current.ok) return current;

  if (!current.value.firstViewedAt) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Leitura deve ser iniciada antes da confirmação." },
    };
  }

  if (current.value.readConfirmedAt) {
    return { ok: true, value: current.value };
  }

  const confirmed = await registerReadConfirmation(reportDeliveryMutationDeps(stack), {
    deliveryId: current.value.deliveryId,
    actorId: input.actorId,
  });

  if (!confirmed.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: confirmed.error.message } };
  }

  if (!current.value.journeyClosed) {
    await closeJourneyAfterReading(stack, {
      journeyId: input.journeyId,
      patientId: input.patientId,
      patientActorId: input.actorId,
    });
  }

  const refreshed = await buildReportReadingView(stack, input);
  if (!refreshed.ok) return refreshed;

  return { ok: true, value: refreshed.value };
}
