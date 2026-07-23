import { registerFirstView } from "@/report-delivery";
import { reportDeliveryMutationDeps, type SystemIntegrationStack } from "@/system-integration";

import { buildReportReadingView } from "../projections/build-report-reading-view";
import type { ReportReadingView } from "../model/report-reading-view";

export interface OpenReportReadingInput {
  journeyId: string;
  patientId: string;
  actorId: string;
}

export type OpenReportReadingResult =
  | { ok: true; value: ReportReadingView }
  | { ok: false; error: { code: "NOT_FOUND" | "UNAVAILABLE" | "DOMAIN_ERROR"; message: string } };

export async function openReportReading(
  stack: SystemIntegrationStack,
  input: OpenReportReadingInput,
): Promise<OpenReportReadingResult> {
  const initial = await buildReportReadingView(stack, input);
  if (!initial.ok) return initial;

  if (!initial.value.firstViewedAt) {
    const viewed = await registerFirstView(reportDeliveryMutationDeps(stack), {
      deliveryId: initial.value.deliveryId,
      actorId: input.actorId,
    });

    if (!viewed.ok) {
      return { ok: false, error: { code: "DOMAIN_ERROR", message: viewed.error.message } };
    }
  }

  const refreshed = await buildReportReadingView(stack, input);
  if (!refreshed.ok) return refreshed;

  return { ok: true, value: refreshed.value };
}
