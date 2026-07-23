import type { DeliveryAccess } from "../model/delivery-access";
import type { ReportDeliverySnapshot } from "../model/report-delivery";
import type { ReportDeliveryMutationDependencies, ReportDeliveryServiceResult } from "./service-helpers";
import {
  loadDeliveryAggregate,
  persistDeliveryAggregate,
  recordDeliveryAccess,
} from "./service-helpers";

export interface RegisterReadConfirmationInput {
  deliveryId: string;
  actorId: string;
}

export interface RegisterReadConfirmationResult {
  delivery: ReportDeliverySnapshot;
  access: DeliveryAccess;
}

export async function registerReadConfirmation(
  deps: ReportDeliveryMutationDependencies,
  input: RegisterReadConfirmationInput,
): Promise<ReportDeliveryServiceResult<RegisterReadConfirmationResult>> {
  const loaded = await loadDeliveryAggregate(deps, input.deliveryId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.registerReadConfirmation({
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
