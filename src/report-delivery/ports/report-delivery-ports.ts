import type { ReportStatus } from "@/curation-report";

import type { DeliveryAccess } from "../model/delivery-access";
import type { DeliveryVersion } from "../model/delivery-version";
import type { ReportDeliverySnapshot } from "../model/report-delivery";

export interface ClockPort {
  now(): string;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface ReportDeliveryContextRecord {
  id: string;
  journeyId: string;
  patientId: string;
  status: ReportStatus;
  currentVersion: number;
}

export interface ReportLookupPort {
  findById(reportId: string): Promise<ReportDeliveryContextRecord | null>;
}

export interface DeliveryRepositoryPort {
  save(snapshot: ReportDeliverySnapshot): Promise<ReportDeliverySnapshot>;
  findById(deliveryId: string): Promise<ReportDeliverySnapshot | null>;
  findActiveByReportAndVersion(
    reportId: string,
    reportVersion: number,
  ): Promise<ReportDeliverySnapshot | null>;
  listByReportId(reportId: string): Promise<ReportDeliverySnapshot[]>;
}

export interface DeliveryAccessRepositoryPort {
  append(access: DeliveryAccess): Promise<DeliveryAccess>;
  listByDeliveryId(deliveryId: string): Promise<DeliveryAccess[]>;
}

export interface DeliveryVersionRepositoryPort {
  append(deliveryId: string, version: DeliveryVersion): Promise<DeliveryVersion>;
  listByDeliveryId(deliveryId: string): Promise<DeliveryVersion[]>;
}
