import { deliverReport } from "@/curation-report";
import { createDelivery, publishDelivery, registerFirstView, registerReadConfirmation } from "@/report-delivery";

import type { SystemIntegrationStack } from "../composition/system-integration-stack";
import {
  curationReportMutationDeps,
  reportDeliveryMutationDeps,
} from "../composition/system-integration-stack";

export interface RunDeliveryLifecycleInput {
  reportId: string;
  curatorActorId: string;
  patientActorId: string;
}

export interface RunDeliveryLifecycleResult {
  deliveryId: string;
  deliveryStatus: string;
  reportStatus: string;
  readConfirmedAt: string | null;
}

export async function runDeliveryLifecycle(
  stack: SystemIntegrationStack,
  input: RunDeliveryLifecycleInput,
): Promise<RunDeliveryLifecycleResult> {
  const deliveryDeps = reportDeliveryMutationDeps(stack);

  const created = await createDelivery(deliveryDeps, {
    reportId: input.reportId,
    actorId: input.curatorActorId,
  });
  if (!created.ok) throw new Error(created.error.message);

  const published = await publishDelivery(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: input.curatorActorId,
  });
  if (!published.ok) throw new Error(published.error.message);

  const delivered = await deliverReport(curationReportMutationDeps(stack), {
    reportId: input.reportId,
    actorId: input.curatorActorId,
  });
  if (!delivered.ok) throw new Error(delivered.error.message);

  const viewed = await registerFirstView(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: input.patientActorId,
  });
  if (!viewed.ok) throw new Error(viewed.error.message);

  const confirmed = await registerReadConfirmation(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: input.patientActorId,
  });
  if (!confirmed.ok) throw new Error(confirmed.error.message);

  return {
    deliveryId: created.value.id,
    deliveryStatus: confirmed.value.delivery.status,
    reportStatus: delivered.value.status,
    readConfirmedAt: confirmed.value.delivery.readConfirmedAt,
  };
}
