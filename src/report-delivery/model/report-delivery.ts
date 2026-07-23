import { err, type Result } from "@/domain/shared/result";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

import type { DeliveryAccessType } from "./delivery-access";
import type { DeliveryAuditEntry, DeliveryAuditAction } from "./delivery-audit-entry";
import type { DeliveryStatus } from "./delivery-status";
import type { DeliveryVersion } from "./delivery-version";
import {
  assertDeliveryStatusTransition,
  isDeliveryAccessible,
} from "../state-machine/delivery-status-machine";

export interface ReportDeliverySnapshot {
  id: string;
  reportId: string;
  journeyId: string;
  patientId: string;
  reportVersion: number;
  status: DeliveryStatus;
  publishedAt: string | null;
  firstViewedAt: string | null;
  readConfirmedAt: string | null;
  reopenCount: number;
  versions: DeliveryVersion[];
  auditTrail: DeliveryAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDeliveryParams {
  id: string;
  reportId: string;
  journeyId: string;
  patientId: string;
  reportVersion: number;
  actorId: string;
  occurredAt: string;
}

interface MutationContext {
  actorId: string;
  occurredAt: string;
  versionSummary: string;
  auditAction: DeliveryAuditAction;
  auditDetails: string;
  nextStatus?: DeliveryStatus;
}

export class DeliveryAggregate {
  private constructor(private snapshot: ReportDeliverySnapshot) {}

  static create(params: CreateReportDeliveryParams): DeliveryAggregate {
    const aggregate = new DeliveryAggregate({
      id: params.id,
      reportId: params.reportId,
      journeyId: params.journeyId,
      patientId: params.patientId,
      reportVersion: params.reportVersion,
      status: "PENDING",
      publishedAt: null,
      firstViewedAt: null,
      readConfirmedAt: null,
      reopenCount: 0,
      versions: [],
      auditTrail: [],
      createdAt: params.occurredAt,
      updatedAt: params.occurredAt,
    });

    aggregate.recordVersionAndAudit({
      actorId: params.actorId,
      occurredAt: params.occurredAt,
      versionSummary: "Entrega criada para relatório aprovado.",
      auditAction: "DELIVERY_CREATED",
      auditDetails: `Entrega vinculada à versão ${params.reportVersion} do relatório.`,
      nextStatus: "PENDING",
      auditEntryId: `${params.id}-audit-1`,
    });

    return aggregate;
  }

  static rehydrate(snapshot: ReportDeliverySnapshot): Result<DeliveryAggregate, BusinessRuleError> {
    if (!snapshot.reportId?.trim()) {
      return err(new BusinessRuleError("Entrega exige relatório associado."));
    }
    if (!snapshot.journeyId?.trim()) {
      return err(new BusinessRuleError("Entrega exige jornada associada."));
    }
    if (!snapshot.patientId?.trim()) {
      return err(new BusinessRuleError("Entrega exige paciente associado."));
    }
    if (snapshot.reportVersion < 1) {
      return err(new BusinessRuleError("Entrega exige versão válida do relatório."));
    }

    return { ok: true, value: new DeliveryAggregate(structuredClone(snapshot)) };
  }

  get id(): string {
    return this.snapshot.id;
  }

  get status(): DeliveryStatus {
    return this.snapshot.status;
  }

  get reportVersion(): number {
    return this.snapshot.reportVersion;
  }

  get versions(): readonly DeliveryVersion[] {
    return this.snapshot.versions;
  }

  get auditTrail(): readonly DeliveryAuditEntry[] {
    return this.snapshot.auditTrail;
  }

  toSnapshot(): ReportDeliverySnapshot {
    return structuredClone(this.snapshot);
  }

  publish(ctx: { actorId: string; occurredAt: string }): Result<DeliveryAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "PENDING") {
      return err(new BusinessRuleError("Entrega já publicada ou encerrada."));
    }

    const transitioned = this.transitionStatus("PUBLISHED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Relatório disponibilizado ao paciente.",
      auditAction: "DELIVERY_PUBLISHED",
      auditDetails: "Entrega publicada e disponível para acesso.",
    });

    if (!transitioned.ok) {
      return transitioned;
    }

    this.snapshot.publishedAt = ctx.occurredAt;
    return { ok: true, value: this };
  }

  registerFirstView(ctx: {
    actorId: string;
    occurredAt: string;
  }): Result<{ aggregate: DeliveryAggregate; accessType: DeliveryAccessType }, BusinessRuleError> {
    if (!isDeliveryAccessible(this.snapshot.status)) {
      return err(new BusinessRuleError("Entrega não está disponível para visualização."));
    }

    if (this.snapshot.firstViewedAt) {
      return err(new BusinessRuleError("Primeira visualização já registrada para esta entrega."));
    }

    this.snapshot.firstViewedAt = ctx.occurredAt;
    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Primeira visualização registrada.",
      auditAction: "FIRST_VIEW_REGISTERED",
      auditDetails: "Paciente acessou o relatório pela primeira vez.",
    });

    return { ok: true, value: { aggregate: this, accessType: "FIRST_VIEW" } };
  }

  registerReadConfirmation(ctx: {
    actorId: string;
    occurredAt: string;
  }): Result<{ aggregate: DeliveryAggregate; accessType: DeliveryAccessType }, BusinessRuleError> {
    if (!isDeliveryAccessible(this.snapshot.status)) {
      return err(new BusinessRuleError("Entrega não está disponível para confirmação de leitura."));
    }

    if (!this.snapshot.firstViewedAt) {
      return err(new BusinessRuleError("Confirmação de leitura exige visualização prévia."));
    }

    if (this.snapshot.readConfirmedAt) {
      return err(new BusinessRuleError("Confirmação de leitura já registrada para esta entrega."));
    }

    this.snapshot.readConfirmedAt = ctx.occurredAt;
    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Confirmação de leitura registrada.",
      auditAction: "READ_CONFIRMATION_REGISTERED",
      auditDetails: "Paciente confirmou a leitura do relatório.",
    });

    return { ok: true, value: { aggregate: this, accessType: "READ_CONFIRMATION" } };
  }

  reopen(ctx: {
    actorId: string;
    occurredAt: string;
  }): Result<{ aggregate: DeliveryAggregate; accessType: DeliveryAccessType }, BusinessRuleError> {
    if (!isDeliveryAccessible(this.snapshot.status)) {
      return err(new BusinessRuleError("Entrega não está disponível para reabertura."));
    }

    if (!this.snapshot.firstViewedAt) {
      return err(new BusinessRuleError("Reabertura exige visualização prévia."));
    }

    this.snapshot.reopenCount += 1;
    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Reabertura do relatório registrada.",
      auditAction: "DELIVERY_REOPENED",
      auditDetails: `Reabertura número ${this.snapshot.reopenCount}.`,
    });

    return { ok: true, value: { aggregate: this, accessType: "REOPEN" } };
  }

  archive(ctx: { actorId: string; occurredAt: string }): Result<DeliveryAggregate, BusinessRuleError> {
    return this.transitionStatus("ARCHIVED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Entrega arquivada.",
      auditAction: "DELIVERY_ARCHIVED",
      auditDetails: "Entrega encerrada no arquivo.",
    });
  }

  private transitionStatus(
    to: DeliveryStatus,
    ctx: Omit<MutationContext, "nextStatus">,
  ): Result<DeliveryAggregate, BusinessRuleError> {
    const from = this.snapshot.status;
    const violation = assertDeliveryStatusTransition(from, to);
    if (violation) {
      return err(new BusinessRuleError(violation));
    }

    this.recordVersionAndAudit({ ...ctx, nextStatus: to });
    return { ok: true, value: this };
  }

  private recordVersionAndAudit(ctx: MutationContext & { auditEntryId?: string }): void {
    const previousStatus = this.snapshot.status;

    if (ctx.nextStatus) {
      this.snapshot.status = ctx.nextStatus;
    }

    this.snapshot.updatedAt = ctx.occurredAt;

    const nextVersion = this.snapshot.versions.length + 1;
    this.snapshot.versions.push({
      version: nextVersion,
      summary: ctx.versionSummary,
      status: this.snapshot.status,
      changedAt: ctx.occurredAt,
      changedBy: ctx.actorId,
    });

    this.snapshot.auditTrail.push({
      id: ctx.auditEntryId ?? `${this.snapshot.id}-audit-${nextVersion}`,
      action: ctx.auditAction,
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      details: ctx.auditDetails,
      fromStatus: ctx.auditAction === "DELIVERY_CREATED" ? null : previousStatus,
      toStatus: this.snapshot.status,
      version: nextVersion,
    });
  }
}
