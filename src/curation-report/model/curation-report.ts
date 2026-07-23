import { err, type Result } from "@/domain/shared/result";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

import type { CuratorNote } from "./curator-note";
import type { Evidence, AddEvidenceInput } from "./evidence";
import type { MedicalCandidate, AddMedicalCandidateInput } from "./medical-candidate";
import type { ReportAuditEntry, ReportAuditAction } from "./report-audit-entry";
import type { ReportStatus } from "./report-status";
import type { ReportVersion } from "./report-version";
import {
  assertReportStatusTransition,
  isReportEditable,
} from "../state-machine/report-status-machine";

export interface CurationReportSnapshot {
  id: string;
  journeyId: string;
  caseId: string;
  patientId: string;
  sharedContextSummary: string;
  criteriaUsed: string[];
  status: ReportStatus;
  currentVersion: number;
  evidences: Evidence[];
  medicalCandidates: MedicalCandidate[];
  curatorNotes: CuratorNote[];
  versions: ReportVersion[];
  auditTrail: ReportAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurationReportParams {
  id: string;
  journeyId: string;
  caseId: string;
  patientId: string;
  sharedContextSummary: string;
  criteriaUsed: string[];
  actorId: string;
  occurredAt: string;
}

interface MutationContext {
  actorId: string;
  occurredAt: string;
  versionSummary: string;
  auditAction: ReportAuditAction;
  auditDetails: string;
  nextStatus?: ReportStatus;
}

export class CurationReportAggregate {
  private constructor(private snapshot: CurationReportSnapshot) {}

  static create(params: CreateCurationReportParams): CurationReportAggregate {
    const aggregate = new CurationReportAggregate({
      id: params.id,
      journeyId: params.journeyId,
      caseId: params.caseId,
      patientId: params.patientId,
      sharedContextSummary: params.sharedContextSummary.trim(),
      criteriaUsed: [...params.criteriaUsed],
      status: "DRAFT",
      currentVersion: 0,
      evidences: [],
      medicalCandidates: [],
      curatorNotes: [],
      versions: [],
      auditTrail: [],
      createdAt: params.occurredAt,
      updatedAt: params.occurredAt,
    });

    aggregate.recordVersionAndAudit({
      actorId: params.actorId,
      occurredAt: params.occurredAt,
      versionSummary: "Relatório de curadoria criado.",
      auditAction: "REPORT_CREATED",
      auditDetails: "Relatório inicial em rascunho.",
      nextStatus: "DRAFT",
      auditEntryId: `${params.id}-audit-1`,
    });

    return aggregate;
  }

  static rehydrate(snapshot: CurationReportSnapshot): Result<CurationReportAggregate, BusinessRuleError> {
    if (!snapshot.journeyId?.trim()) {
      return err(new BusinessRuleError("Relatório exige jornada associada."));
    }
    if (!snapshot.caseId?.trim()) {
      return err(new BusinessRuleError("Relatório exige caso associado."));
    }
    if (!snapshot.patientId?.trim()) {
      return err(new BusinessRuleError("Relatório exige paciente associado."));
    }

    return { ok: true, value: new CurationReportAggregate(structuredClone(snapshot)) };
  }

  get id(): string {
    return this.snapshot.id;
  }

  get status(): ReportStatus {
    return this.snapshot.status;
  }

  get currentVersion(): number {
    return this.snapshot.currentVersion;
  }

  get versions(): readonly ReportVersion[] {
    return this.snapshot.versions;
  }

  get auditTrail(): readonly ReportAuditEntry[] {
    return this.snapshot.auditTrail;
  }

  toSnapshot(): CurationReportSnapshot {
    return structuredClone(this.snapshot);
  }

  addEvidence(
    evidenceId: string,
    input: AddEvidenceInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationReportAggregate, BusinessRuleError> {
    if (!isReportEditable(this.snapshot.status)) {
      return err(new BusinessRuleError("Relatório não aceita novas evidências neste status."));
    }

    if (!input.description.trim()) {
      return err(new BusinessRuleError("Descrição da evidência é obrigatória."));
    }

    if (input.confidence < 0 || input.confidence > 1) {
      return err(new BusinessRuleError("Confiança da evidência deve estar entre 0 e 1."));
    }

    this.snapshot.evidences.push({
      id: evidenceId,
      origin: input.origin.trim(),
      description: input.description.trim(),
      type: input.type,
      confidence: input.confidence,
      reference: input.reference.trim(),
      addedAt: ctx.occurredAt,
      addedBy: ctx.actorId,
    });

    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Evidência adicionada ao relatório.",
      auditAction: "EVIDENCE_ADDED",
      auditDetails: input.description.trim(),
    });

    return { ok: true, value: this };
  }

  addMedicalCandidate(
    candidateId: string,
    reasonIds: string[],
    input: AddMedicalCandidateInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationReportAggregate, BusinessRuleError> {
    if (!isReportEditable(this.snapshot.status)) {
      return err(new BusinessRuleError("Relatório não aceita novos candidatos neste status."));
    }

    if (!input.identification.trim() || !input.specialty.trim()) {
      return err(new BusinessRuleError("Candidato exige identificação e especialidade."));
    }

    if (input.priority < 1) {
      return err(new BusinessRuleError("Prioridade do candidato deve ser positiva."));
    }

    const missingEvidence = input.relatedEvidenceIds.find(
      (evidenceId) => !this.snapshot.evidences.some((evidence) => evidence.id === evidenceId),
    );
    if (missingEvidence) {
      return err(new BusinessRuleError(`Evidência relacionada não encontrada: ${missingEvidence}.`));
    }

    this.snapshot.medicalCandidates.push({
      id: candidateId,
      identification: input.identification.trim(),
      specialty: input.specialty.trim(),
      justification: input.justification.trim(),
      relatedEvidenceIds: [...input.relatedEvidenceIds],
      priority: input.priority,
      selectionReasons: input.selectionReasons.map((reason, index) => ({
        id: reasonIds[index]!,
        criterion: reason.criterion.trim(),
        rationale: reason.rationale.trim(),
      })),
      addedAt: ctx.occurredAt,
      addedBy: ctx.actorId,
    });

    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Candidato médico adicionado ao relatório.",
      auditAction: "CANDIDATE_ADDED",
      auditDetails: input.identification.trim(),
    });

    return { ok: true, value: this };
  }

  addCuratorNote(
    noteId: string,
    content: string,
    ctx: { actorId: string; occurredAt: string; submitForReview?: boolean },
  ): Result<CurationReportAggregate, BusinessRuleError> {
    if (!isReportEditable(this.snapshot.status)) {
      return err(new BusinessRuleError("Relatório não aceita novas observações neste status."));
    }

    if (!content.trim()) {
      return err(new BusinessRuleError("Observação do curador é obrigatória."));
    }

    this.snapshot.curatorNotes.push({
      id: noteId,
      content: content.trim(),
      authorId: ctx.actorId,
      createdAt: ctx.occurredAt,
    });

    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Observação do curador registrada.",
      auditAction: "NOTE_ADDED",
      auditDetails: content.trim(),
    });

    if (ctx.submitForReview) {
      return this.submitForReview(ctx);
    }

    return { ok: true, value: this };
  }

  submitForReview(ctx: { actorId: string; occurredAt: string }): Result<CurationReportAggregate, BusinessRuleError> {
    return this.transitionStatus("UNDER_REVIEW", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Relatório enviado para revisão.",
      auditAction: "SUBMITTED_FOR_REVIEW",
      auditDetails: "Relatório disponível para revisão.",
    });
  }

  approve(ctx: { actorId: string; occurredAt: string }): Result<CurationReportAggregate, BusinessRuleError> {
    if (this.snapshot.evidences.length === 0) {
      return err(new BusinessRuleError("Relatório exige ao menos uma evidência para aprovação."));
    }

    if (this.snapshot.medicalCandidates.length === 0) {
      return err(new BusinessRuleError("Relatório exige ao menos um candidato médico para aprovação."));
    }

    return this.transitionStatus("APPROVED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Relatório aprovado pela curadoria.",
      auditAction: "APPROVED",
      auditDetails: "Relatório aprovado para entrega.",
    });
  }

  deliver(ctx: { actorId: string; occurredAt: string }): Result<CurationReportAggregate, BusinessRuleError> {
    return this.transitionStatus("DELIVERED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Relatório entregue ao paciente.",
      auditAction: "DELIVERED",
      auditDetails: "Relatório marcado como entregue.",
    });
  }

  archive(ctx: { actorId: string; occurredAt: string }): Result<CurationReportAggregate, BusinessRuleError> {
    return this.transitionStatus("ARCHIVED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Relatório arquivado.",
      auditAction: "ARCHIVED",
      auditDetails: "Relatório encerrado no arquivo.",
    });
  }

  private transitionStatus(
    to: ReportStatus,
    ctx: Omit<MutationContext, "nextStatus">,
  ): Result<CurationReportAggregate, BusinessRuleError> {
    const from = this.snapshot.status;
    const violation = assertReportStatusTransition(from, to);
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

    this.snapshot.currentVersion += 1;
    this.snapshot.updatedAt = ctx.occurredAt;

    this.snapshot.versions.push({
      version: this.snapshot.currentVersion,
      summary: ctx.versionSummary,
      status: this.snapshot.status,
      changedAt: ctx.occurredAt,
      changedBy: ctx.actorId,
    });

    this.snapshot.auditTrail.push({
      id: ctx.auditEntryId ?? `${this.snapshot.id}-audit-${this.snapshot.currentVersion}`,
      action: ctx.auditAction,
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      details: ctx.auditDetails,
      fromStatus: ctx.auditAction === "REPORT_CREATED" ? null : previousStatus,
      toStatus: this.snapshot.status,
      version: this.snapshot.currentVersion,
    });
  }
}
