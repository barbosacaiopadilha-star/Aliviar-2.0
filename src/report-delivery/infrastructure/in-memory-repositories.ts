import type { DeliveryAccess } from "../model/delivery-access";
import type { DeliveryVersion } from "../model/delivery-version";
import type { ReportDeliverySnapshot } from "../model/report-delivery";
import type {
  DeliveryAccessRepositoryPort,
  DeliveryRepositoryPort,
  DeliveryVersionRepositoryPort,
  ReportDeliveryContextRecord,
  ReportLookupPort,
} from "../ports/report-delivery-ports";

export class InMemoryDeliveryRepository implements DeliveryRepositoryPort {
  private readonly deliveries = new Map<string, ReportDeliverySnapshot>();

  async save(snapshot: ReportDeliverySnapshot): Promise<ReportDeliverySnapshot> {
    this.deliveries.set(snapshot.id, structuredClone(snapshot));
    return structuredClone(snapshot);
  }

  async findById(deliveryId: string): Promise<ReportDeliverySnapshot | null> {
    const delivery = this.deliveries.get(deliveryId);
    return delivery ? structuredClone(delivery) : null;
  }

  async findActiveByReportAndVersion(
    reportId: string,
    reportVersion: number,
  ): Promise<ReportDeliverySnapshot | null> {
    const delivery = [...this.deliveries.values()].find(
      (item) =>
        item.reportId === reportId &&
        item.reportVersion === reportVersion &&
        item.status !== "ARCHIVED",
    );
    return delivery ? structuredClone(delivery) : null;
  }

  async listByReportId(reportId: string): Promise<ReportDeliverySnapshot[]> {
    return [...this.deliveries.values()]
      .filter((item) => item.reportId === reportId)
      .map((item) => structuredClone(item));
  }
}

export class InMemoryDeliveryAccessRepository implements DeliveryAccessRepositoryPort {
  private readonly accesses = new Map<string, DeliveryAccess[]>();

  async append(access: DeliveryAccess): Promise<DeliveryAccess> {
    const existing = this.accesses.get(access.deliveryId) ?? [];
    existing.push(structuredClone(access));
    this.accesses.set(access.deliveryId, existing);
    return structuredClone(access);
  }

  async listByDeliveryId(deliveryId: string): Promise<DeliveryAccess[]> {
    return structuredClone(this.accesses.get(deliveryId) ?? []);
  }
}

export class InMemoryDeliveryVersionRepository implements DeliveryVersionRepositoryPort {
  private readonly versions = new Map<string, DeliveryVersion[]>();

  async append(deliveryId: string, version: DeliveryVersion): Promise<DeliveryVersion> {
    const existing = this.versions.get(deliveryId) ?? [];
    existing.push(structuredClone(version));
    this.versions.set(deliveryId, existing);
    return structuredClone(version);
  }

  async listByDeliveryId(deliveryId: string): Promise<DeliveryVersion[]> {
    return structuredClone(this.versions.get(deliveryId) ?? []);
  }
}

export class InMemoryReportLookup implements ReportLookupPort {
  constructor(private readonly reports: ReportDeliveryContextRecord[]) {}

  async findById(reportId: string): Promise<ReportDeliveryContextRecord | null> {
    return this.reports.find((item) => item.id === reportId) ?? null;
  }
}
