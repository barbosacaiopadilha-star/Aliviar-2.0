import type { DeliveryAccess } from "../model/delivery-access";
import type { ReportDeliverySnapshot } from "../model/report-delivery";
import type { ReportDeliveryMutationDependencies, ReportDeliveryServiceResult } from "./service-helpers";
import {
  loadDeliveryAggregate,
  persistDeliveryAggregate,
  recordDeliveryAccess,
} from "./service-helpers";

export interface RegisterFirstViewInput {
  deliveryId: string;
  actorId: string;
}

export interface RegisterFirstViewResult {
  delivery: ReportDeliverySnapshot;
  access: DeliveryAccess;
}

export async function registerFirstView(
  deps: ReportDeliveryMutationDependencies,
  input: RegisterFirstViewInput,
): Promise<ReportDeliveryServiceResult<RegisterFirstViewResult>> {
  const loaded = await loadDeliveryAggregate(deps, input.deliveryId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.registerFirstView({
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  const persisted = await persistDeliveryAggregate(deps, mutated.value.aggregate);
  if (!persisted.ok) return persisted;

  const access = await recordDeliveryAccess(deps, {
    deliveryId: input.deliveryId,
    actorId: input.actorId,
    accessType: mutated.value.accessType,
  });

  return { ok: true, value: { delivery: persisted.value, access } };
}
