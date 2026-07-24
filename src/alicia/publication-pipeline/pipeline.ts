import type { DoctorCandidate, PublicationDecision } from "@/alicia/protocol-engine";

import { PublicationAuditTrail } from "./audit";
import { buildPublicationDraft } from "./draft-builder";
import { InMemoryPublicationRepository } from "./infrastructure/in-memory-publication-repository";
import { verifyPublishedProfile } from "./post-publish-verifier";
import { runPreflightValidation } from "./preflight-validator";
import type { PublicationRepository } from "./ports/publication-repository";
import { publishSnapshotAtomically } from "./publisher";
import { executeRollback } from "./rollback";
import { buildIdempotencyKey, hashPayload } from "./hash";
import { createImmutableSnapshot } from "./snapshot";
import { classifyUpdate } from "./update-classifier";
import type {
  PipelineInput,
  PipelineResult,
  PipelineReviewCase,
  PipelineReviewCaseReason,
} from "./types";

export type PublicationPipelineOptions = {
  repository?: PublicationRepository;
  audit?: PublicationAuditTrail;
};

function createReviewCase(input: {
  candidateId: string;
  caseId: string;
  doctorId: string;
  reason: PipelineReviewCaseReason;
  summary: string;
  blocks?: PipelineReviewCase["blocks"];
}): PipelineReviewCase {
  return {
    candidateId: input.candidateId,
    caseId: input.caseId,
    doctorId: input.doctorId,
    reason: input.reason,
    summary: input.summary,
    blocks: input.blocks ?? [],
    createdAt: new Date().toISOString(),
  };
}

export class PublicationPipeline {
  private readonly repository: PublicationRepository;
  private readonly audit: PublicationAuditTrail;

  constructor(options: PublicationPipelineOptions = {}) {
    this.repository = options.repository ?? new InMemoryPublicationRepository();
    this.audit = options.audit ?? new PublicationAuditTrail();
  }

  getRepository(): PublicationRepository {
    return this.repository;
  }

  getAuditTrail(): PublicationAuditTrail {
    return this.audit;
  }

  execute(input: PipelineInput): PipelineResult {
    const { candidate, evidence, decision } = input;

    if (decision.outcome === "HUMAN_REVIEW") {
      return {
        status: "REJECTED",
        message: "Pipeline rejeita entradas com HUMAN_REVIEW.",
        reviewCase: createReviewCase({
          candidateId: candidate.id,
          caseId: candidate.caseId,
          doctorId: candidate.id,
          reason: "NOT_AUTO_PUBLISH",
          summary: decision.justification,
        }),
      };
    }

    if (decision.outcome === "REJECT") {
      return {
        status: "REJECTED",
        message: "Pipeline rejeita entradas com REJECT.",
        reviewCase: createReviewCase({
          candidateId: candidate.id,
          caseId: candidate.caseId,
          doctorId: candidate.id,
          reason: "NOT_AUTO_PUBLISH",
          summary: decision.justification,
        }),
      };
    }

    let draft;
    try {
      draft = buildPublicationDraft({
        candidate,
        evidence,
        evidenceReport: decision.evidenceReport,
        decision,
        protocolDecisionId: input.protocolDecisionId,
        evidenceReportId: input.evidenceReportId,
      });
    } catch (error) {
      return {
        status: "BLOCKED",
        message: error instanceof Error ? error.message : "Falha ao criar draft.",
      };
    }

    this.audit.record({
      type: "PUBLICATION_DRAFTED",
      candidateId: candidate.id,
      doctorId: draft.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      publicationDraftId: draft.id,
      outcome: "drafted",
      reasons: [],
      evidenceIds: evidence.map((item) => item.id),
    });

    const existingRecord = this.repository.findPublishedByDoctorId(draft.doctorId);
    const updateClassification = classifyUpdate(existingRecord, draft.payload);

    const contentHash = hashPayload(draft.payload);
    const idempotencyKey = buildIdempotencyKey({
      candidateId: draft.candidateId,
      protocolDecisionId: input.protocolDecisionId,
      protocolVersion: draft.protocolVersion,
      contentHash,
    });

    const existingByKey = this.repository.findByIdempotencyKey(idempotencyKey);
    if (existingByKey?.publishedAt) {
      return {
        status: "ALREADY_PUBLISHED",
        doctorId: draft.doctorId,
        snapshotId: existingByKey.snapshotId,
        idempotencyKey,
        profileVersion: existingByKey.profileVersion,
        message: "Decisão já processada — idempotência preservada.",
      };
    }

    if (updateClassification === "NO_CHANGE") {
      return {
        status: "NO_CHANGE",
        doctorId: draft.doctorId,
        snapshotId: this.repository.getActiveSnapshotId(draft.doctorId),
        updateClassification,
        message: "Nenhuma alteração detectada no payload público.",
      };
    }

    if (updateClassification === "MATERIAL_UPDATE" || updateClassification === "REVIEW_REQUIRED") {
      const reviewCase = createReviewCase({
        candidateId: candidate.id,
        caseId: candidate.caseId,
        doctorId: draft.doctorId,
        reason: updateClassification === "MATERIAL_UPDATE" ? "MATERIAL_UPDATE" : "REVIEW_REQUIRED",
        summary: `Atualização classificada como ${updateClassification} — revisão humana necessária.`,
      });

      this.audit.record({
        type: "PUBLICATION_FAILED",
        candidateId: candidate.id,
        doctorId: draft.doctorId,
        protocolDecisionId: input.protocolDecisionId,
        publicationDraftId: draft.id,
        outcome: updateClassification,
        reasons: [reviewCase.summary],
        evidenceIds: evidence.map((item) => item.id),
      });

      return {
        status: "BLOCKED",
        doctorId: draft.doctorId,
        updateClassification,
        reviewCase,
        message: reviewCase.summary,
      };
    }

    const preflight = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(this.repository.listPublishedDoctorIds()),
      existingCrms: new Set(this.repository.listPublishedCrms()),
      currentDoctorId: existingRecord ? draft.doctorId : undefined,
      publishedCrmByDoctorId: this.repository.listPublishedCrmByDoctorId(),
    });

    if (preflight.status === "PUBLICATION_BLOCKED") {
      this.audit.record({
        type: "PREFLIGHT_BLOCKED",
        candidateId: candidate.id,
        doctorId: draft.doctorId,
        protocolDecisionId: input.protocolDecisionId,
        publicationDraftId: draft.id,
        outcome: "blocked",
        reasons: preflight.blocks.map((item) => item.message),
        evidenceIds: evidence.map((item) => item.id),
      });

      return {
        status: "BLOCKED",
        doctorId: draft.doctorId,
        blocks: preflight.blocks,
        reviewCase: createReviewCase({
          candidateId: candidate.id,
          caseId: candidate.caseId,
          doctorId: draft.doctorId,
          reason: "PUBLICATION_BLOCKED",
          summary: preflight.blocks.map((item) => item.message).join(" "),
          blocks: preflight.blocks,
        }),
      };
    }

    this.audit.record({
      type: "PREFLIGHT_PASSED",
      candidateId: candidate.id,
      doctorId: draft.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      publicationDraftId: draft.id,
      outcome: "passed",
      reasons: [],
      evidenceIds: evidence.map((item) => item.id),
    });

    const profileVersion = (this.repository.listHistory(draft.doctorId).length || 0) + 1;
    const snapshot = createImmutableSnapshot({
      draft,
      profileVersion,
      supersedesSnapshotId: this.repository.getActiveSnapshotId(draft.doctorId) ?? null,
    });

    this.repository.stage(snapshot);
    this.audit.record({
      type: "SNAPSHOT_STAGED",
      candidateId: candidate.id,
      doctorId: draft.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      publicationDraftId: draft.id,
      snapshotId: snapshot.snapshotId,
      outcome: "staged",
      reasons: [],
      evidenceIds: evidence.map((item) => item.id),
    });

    try {
      publishSnapshotAtomically(this.repository, snapshot);
    } catch (error) {
      this.audit.record({
        type: "PUBLICATION_FAILED",
        candidateId: candidate.id,
        doctorId: draft.doctorId,
        protocolDecisionId: input.protocolDecisionId,
        snapshotId: snapshot.snapshotId,
        outcome: "failed",
        reasons: [error instanceof Error ? error.message : "Falha na publicação."],
        evidenceIds: evidence.map((item) => item.id),
      });

      return {
        status: "BLOCKED",
        doctorId: draft.doctorId,
        snapshotId: snapshot.snapshotId,
        message: error instanceof Error ? error.message : "Falha na publicação.",
      };
    }

    this.audit.record({
      type: "PROFILE_PUBLISHED",
      candidateId: candidate.id,
      doctorId: draft.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      publicationDraftId: draft.id,
      snapshotId: snapshot.snapshotId,
      outcome: "published",
      reasons: [],
      evidenceIds: evidence.map((item) => item.id),
    });

    const verification = verifyPublishedProfile(this.repository, {
      ...snapshot,
      publishedAt: new Date().toISOString(),
    });

    if (verification.status === "PUBLICATION_INCONSISTENT") {
      this.audit.record({
        type: "PUBLICATION_INCONSISTENT",
        candidateId: candidate.id,
        doctorId: draft.doctorId,
        protocolDecisionId: input.protocolDecisionId,
        snapshotId: snapshot.snapshotId,
        outcome: "inconsistent",
        reasons: verification.checks.filter((check) => !check.passed).map((check) => check.message ?? check.name),
        evidenceIds: evidence.map((item) => item.id),
      });

      const rollback = executeRollback({
        repository: this.repository,
        audit: this.audit,
        snapshotId: snapshot.snapshotId,
        doctorId: draft.doctorId,
        candidateId: candidate.id,
        protocolDecisionId: input.protocolDecisionId,
        reason: "Post-publish verification failed",
      });

      return {
        status: "ROLLBACK_EXECUTED",
        doctorId: draft.doctorId,
        snapshotId: snapshot.snapshotId,
        reviewCase: createReviewCase({
          candidateId: candidate.id,
          caseId: candidate.caseId,
          doctorId: draft.doctorId,
          reason: "PUBLICATION_INCONSISTENT",
          summary: `Verificação pós-publicação falhou. Rollback: ${rollback.message}`,
        }),
        message: rollback.message,
      };
    }

    this.audit.record({
      type: "POST_PUBLISH_VERIFIED",
      candidateId: candidate.id,
      doctorId: draft.doctorId,
      protocolDecisionId: input.protocolDecisionId,
      snapshotId: snapshot.snapshotId,
      outcome: "verified",
      reasons: [],
      evidenceIds: evidence.map((item) => item.id),
    });

    return {
      status: "PUBLISHED",
      doctorId: draft.doctorId,
      snapshotId: snapshot.snapshotId,
      profileVersion: snapshot.profileVersion,
      idempotencyKey: snapshot.idempotencyKey,
      updateClassification,
      message: "Perfil publicado e verificado com sucesso.",
    };
  }
}

export function runPublicationPipeline(
  input: PipelineInput,
  options?: PublicationPipelineOptions,
): PipelineResult {
  return new PublicationPipeline(options).execute(input);
}
