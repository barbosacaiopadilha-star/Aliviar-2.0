import type { DeliveryAccess } from "../model/delivery-access";
import type { ReportDeliverySnapshot } from "../model/report-delivery";
import { DeliveryAggregate } from "../model/report-delivery";
import type {
  ClockPort,
  DeliveryAccessRepositoryPort,
  DeliveryRepositoryPort,
  DeliveryVersionRepositoryPort,
  IdGeneratorPort,
  ReportLookupPort,
} from "../ports/report-delivery-ports";

export type ReportDeliveryServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type ReportDeliveryServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ReportDeliveryServiceError };

export interface ReportDeliveryPersistenceDependencies {
  deliveryRepository: DeliveryRepositoryPort;
  versionRepository: DeliveryVersionRepositoryPort;
  clock: ClockPort;
}

export interface ReportDeliveryMutationDependencies extends ReportDeliveryPersistenceDependencies {
  accessRepository: DeliveryAccessRepositoryPort;
  reportLookup: ReportLookupPort;
  ids: IdGeneratorPort;
}

export async function loadDeliveryAggregate(
  deps: Pick<ReportDeliveryPersistenceDependencies, "deliveryRepository">,
  deliveryId: string,
): Promise<ReportDeliveryServiceResult<DeliveryAggregate>> {
  const snapshot = await deps.deliveryRepository.findById(deliveryId);
  if (!snapshot) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Entrega não encontrada." } };
  }

  const aggregate = DeliveryAggregate.rehydrate(snapshot);
  if (!aggregate.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: aggregate.error.message } };
  }

  return { ok: true, value: aggregate.value };
}

export async function persistDeliveryAggregate(
  deps: ReportDeliveryPersistenceDependencies,
  aggregate: DeliveryAggregate,
): Promise<ReportDeliveryServiceResult<ReportDeliverySnapshot>> {
  const snapshot = aggregate.toSnapshot();
  const existingVersions = await deps.versionRepository.listByDeliveryId(snapshot.id);

  for (const version of snapshot.versions) {
    if (!existingVersions.some((item) => item.version === version.version)) {
      await deps.versionRepository.append(snapshot.id, version);
    }
  }

  const saved = await deps.deliveryRepository.save(snapshot);
  return { ok: true, value: saved };
}

export async function recordDeliveryAccess(
  deps: Pick<ReportDeliveryMutationDependencies, "accessRepository" | "ids" | "clock">,
  input: {
    deliveryId: string;
    actorId: string;
    accessType: DeliveryAccess["accessType"];
  },
): Promise<DeliveryAccess> {
  return deps.accessRepository.append({
    id: deps.ids.nextId(),
    deliveryId: input.deliveryId,
    accessType: input.accessType,
    actorId: input.actorId,
    accessedAt: deps.clock.now(),
  });
}
