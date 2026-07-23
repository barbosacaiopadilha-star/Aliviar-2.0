import type { ReportDeliverySnapshot } from "../model/report-delivery";
import type { ReportDeliveryMutationDependencies, ReportDeliveryServiceResult } from "./service-helpers";
import { loadDeliveryAggregate, persistDeliveryAggregate } from "./service-helpers";

export interface PublishDeliveryInput {
  deliveryId: string;
  actorId: string;
}

export async function publishDelivery(
  deps: ReportDeliveryMutationDependencies,
  input: PublishDeliveryInput,
): Promise<ReportDeliveryServiceResult<ReportDeliverySnapshot>> {
  const loaded = await loadDeliveryAggregate(deps, input.deliveryId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.publish({
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistDeliveryAggregate(deps, mutated.value);
}
