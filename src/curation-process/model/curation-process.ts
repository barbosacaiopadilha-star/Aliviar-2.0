import { err, type Result } from "@/domain/shared/result";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

import type { CandidateReview, AddCandidateReviewInput } from "./candidate-review";
import type { Comparison, CompareCandidatesInput } from "./comparison";
import type { Investigation, StartInvestigationInput } from "./investigation";
import type { ProcessAuditEntry, ProcessAuditAction } from "./process-audit-entry";
import type { ProcessStatus } from "./process-status";
import type { ProcessVersion } from "./process-version";
import type { ReviewCycle, SubmitForFinalReviewInput } from "./review-cycle";
import {
  assertProcessStatusTransition,
  canCancelProcess,
} from "../state-machine/process-status-machine";

export interface CurationProcessSnapshot {
  id: string;
  reportId: string;
  journeyId: string;
  curatorId: string;
  status: ProcessStatus;
  investigation: Investigation | null;
  researchSessionIds: string[];
  candidateReviews: CandidateReview[];
  comparisons: Comparison[];
  reviewCycles: ReviewCycle[];
  versions: ProcessVersion[];
  auditTrail: ProcessAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurationProcessParams {
  id: string;
  reportId: string;
  journeyId: string;
  curatorId: string;
  actorId: string;
  occurredAt: string;
}

interface MutationContext {
  actorId: string;
  occurredAt: string;
  versionSummary: string;
  auditAction: ProcessAuditAction;
  auditDetails: string;
  nextStatus?: ProcessStatus;
}

export class CurationProcessAggregate {
  private constructor(private snapshot: CurationProcessSnapshot) {}

  static create(params: CreateCurationProcessParams): CurationProcessAggregate {
    const aggregate = new CurationProcessAggregate({
      id: params.id,
      reportId: params.reportId,
      journeyId: params.journeyId,
      curatorId: params.curatorId,
      status: "CREATED",
      investigation: null,
      researchSessionIds: [],
      candidateReviews: [],
      comparisons: [],
      reviewCycles: [],
      versions: [],
      auditTrail: [],
      createdAt: params.occurredAt,
      updatedAt: params.occurredAt,
    });

    aggregate.recordVersionAndAudit({
      actorId: params.actorId,
      occurredAt: params.occurredAt,
      versionSummary: "Processo de curadoria criado.",
      auditAction: "PROCESS_CREATED",
      auditDetails: "Processo vinculado ao relatório de curadoria.",
      nextStatus: "CREATED",
      auditEntryId: `${params.id}-audit-1`,
    });

    return aggregate;
  }

  static rehydrate(snapshot: CurationProcessSnapshot): Result<CurationProcessAggregate, BusinessRuleError> {
    if (!snapshot.reportId?.trim()) {
      return err(new BusinessRuleError("Processo exige relatório associado."));
    }
    if (!snapshot.journeyId?.trim()) {
      return err(new BusinessRuleError("Processo exige jornada associada."));
    }
    if (!snapshot.curatorId?.trim()) {
      return err(new BusinessRuleError("Processo exige curador responsável."));
    }

    return { ok: true, value: new CurationProcessAggregate(structuredClone(snapshot)) };
  }

  get id(): string {
    return this.snapshot.id;
  }

  get status(): ProcessStatus {
    return this.snapshot.status;
  }

  get reportId(): string {
    return this.snapshot.reportId;
  }

  get versions(): readonly ProcessVersion[] {
    return this.snapshot.versions;
  }

  get auditTrail(): readonly ProcessAuditEntry[] {
    return this.snapshot.auditTrail;
  }

  toSnapshot(): CurationProcessSnapshot {
    return structuredClone(this.snapshot);
  }

  startInvestigation(
    investigationId: string,
    input: StartInvestigationInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "CREATED") {
      return err(new BusinessRuleError("Investigação só pode iniciar em processo recém-criado."));
    }

    if (!input.summary.trim() || !input.scope.trim()) {
      return err(new BusinessRuleError("Investigação exige resumo e escopo."));
    }

    this.snapshot.investigation = {
      id: investigationId,
      summary: input.summary.trim(),
      scope: input.scope.trim(),
      startedAt: ctx.occurredAt,
      startedBy: ctx.actorId,
    };

    return this.transitionStatus("INVESTIGATING", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Investigação iniciada.",
      auditAction: "INVESTIGATION_STARTED",
      auditDetails: input.summary.trim(),
    });
  }

  registerResearchSession(
    sessionId: string,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "INVESTIGATING" && this.snapshot.status !== "RESEARCHING") {
      return err(new BusinessRuleError("Pesquisa só pode ser registrada durante investigação ou pesquisa."));
    }

    if (!this.snapshot.researchSessionIds.includes(sessionId)) {
      this.snapshot.researchSessionIds.push(sessionId);
    }

    if (this.snapshot.status === "INVESTIGATING") {
      return this.transitionStatus("RESEARCHING", {
        actorId: ctx.actorId,
        occurredAt: ctx.occurredAt,
        versionSummary: "Sessão de pesquisa aberta.",
        auditAction: "RESEARCH_FINDING_REGISTERED",
        auditDetails: `Sessão ${sessionId} vinculada ao processo.`,
      });
    }

    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Achado de pesquisa registrado.",
      auditAction: "RESEARCH_FINDING_REGISTERED",
      auditDetails: `Sessão ${sessionId} atualizada.`,
    });

    return { ok: true, value: this };
  }

  addCandidateReview(
    reviewId: string,
    input: AddCandidateReviewInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "RESEARCHING" && this.snapshot.status !== "COMPARING") {
      return err(new BusinessRuleError("Revisão de candidato exige etapa de pesquisa ou comparação."));
    }

    if (!input.candidateId.trim() || !input.assessment.trim()) {
      return err(new BusinessRuleError("Revisão de candidato exige identificação e avaliação."));
    }

    if (this.snapshot.candidateReviews.some((review) => review.candidateId === input.candidateId)) {
      return err(new BusinessRuleError("Candidato já revisado neste processo."));
    }

    this.snapshot.candidateReviews.push({
      id: reviewId,
      candidateId: input.candidateId.trim(),
      assessment: input.assessment.trim(),
      notes: input.notes.trim(),
      reviewedAt: ctx.occurredAt,
      reviewedBy: ctx.actorId,
    });

    if (this.snapshot.status === "RESEARCHING") {
      return this.transitionStatus("COMPARING", {
        actorId: ctx.actorId,
        occurredAt: ctx.occurredAt,
        versionSummary: "Revisão de candidato registrada.",
        auditAction: "CANDIDATE_REVIEW_ADDED",
        auditDetails: input.candidateId.trim(),
      });
    }

    this.recordVersionAndAudit({
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Revisão de candidato registrada.",
      auditAction: "CANDIDATE_REVIEW_ADDED",
      auditDetails: input.candidateId.trim(),
    });

    return { ok: true, value: this };
  }

  compareCandidates(
    comparisonId: string,
    input: CompareCandidatesInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "COMPARING") {
      return err(new BusinessRuleError("Comparação exige etapa de comparação ativa."));
    }

    if (input.candidateIds.length < 2) {
      return err(new BusinessRuleError("Comparação exige ao menos dois candidatos."));
    }

    if (!input.conclusion.trim()) {
      return err(new BusinessRuleError("Comparação exige conclusão."));
    }

    const reviewedIds = new Set(this.snapshot.candidateReviews.map((review) => review.candidateId));
    const missing = input.candidateIds.find((candidateId) => !reviewedIds.has(candidateId));
    if (missing) {
      return err(new BusinessRuleError(`Candidato não revisado: ${missing}.`));
    }

    this.snapshot.comparisons.push({
      id: comparisonId,
      candidateIds: [...input.candidateIds],
      criteria: [...input.criteria],
      conclusion: input.conclusion.trim(),
      comparedAt: ctx.occurredAt,
      comparedBy: ctx.actorId,
    });

    return this.transitionStatus("REVIEWING", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Candidatos comparados.",
      auditAction: "CANDIDATES_COMPARED",
      auditDetails: input.conclusion.trim(),
    });
  }

  submitForFinalReview(
    cycleId: string,
    input: SubmitForFinalReviewInput,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "REVIEWING") {
      return err(new BusinessRuleError("Revisão final exige etapa de revisão ativa."));
    }

    if (!input.summary.trim()) {
      return err(new BusinessRuleError("Revisão final exige resumo."));
    }

    if (this.snapshot.comparisons.length === 0) {
      return err(new BusinessRuleError("Revisão final exige comparação prévia."));
    }

    this.snapshot.reviewCycles.push({
      id: cycleId,
      cycleNumber: this.snapshot.reviewCycles.length + 1,
      summary: input.summary.trim(),
      submittedAt: ctx.occurredAt,
      submittedBy: ctx.actorId,
    });

    return this.transitionStatus("READY_FOR_APPROVAL", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Processo enviado para aprovação final.",
      auditAction: "SUBMITTED_FOR_FINAL_REVIEW",
      auditDetails: input.summary.trim(),
    });
  }

  complete(ctx: { actorId: string; occurredAt: string }): Result<CurationProcessAggregate, BusinessRuleError> {
    if (this.snapshot.status !== "READY_FOR_APPROVAL") {
      return err(new BusinessRuleError("Conclusão exige processo pronto para aprovação."));
    }

    return this.transitionStatus("COMPLETED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Processo de curadoria concluído.",
      auditAction: "PROCESS_COMPLETED",
      auditDetails: "Processo encerrado após aprovação do relatório.",
    });
  }

  cancel(
    reason: string,
    ctx: { actorId: string; occurredAt: string },
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    if (!canCancelProcess(this.snapshot.status)) {
      return err(new BusinessRuleError("Processo não pode ser cancelado neste status."));
    }

    if (!reason.trim()) {
      return err(new BusinessRuleError("Cancelamento exige motivo."));
    }

    return this.transitionStatus("CANCELLED", {
      actorId: ctx.actorId,
      occurredAt: ctx.occurredAt,
      versionSummary: "Processo de curadoria cancelado.",
      auditAction: "PROCESS_CANCELLED",
      auditDetails: reason.trim(),
    });
  }

  private transitionStatus(
    to: ProcessStatus,
    ctx: Omit<MutationContext, "nextStatus">,
  ): Result<CurationProcessAggregate, BusinessRuleError> {
    const from = this.snapshot.status;
    const violation = assertProcessStatusTransition(from, to);
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
      fromStatus: ctx.auditAction === "PROCESS_CREATED" ? null : previousStatus,
      toStatus: this.snapshot.status,
      version: nextVersion,
    });
  }
}
