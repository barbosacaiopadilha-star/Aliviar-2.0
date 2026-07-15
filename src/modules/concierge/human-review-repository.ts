import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { ProviderChange, ReviewAction } from "@/modules/ace/artifacts/human-review-result";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";
import { p009HumanReview } from "@/modules/ace/protocols/p009-human-review";

import { changeCaseStatus, getCase } from "@/modules/cases/repository";

import { getLatestArtifactByType, getLatestExecution } from "./execution-repository";
import type { HumanReviewResultRecord } from "./types";

async function nameByProfileId(supabase: SupabaseClient, profileId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", profileId).maybeSingle();
  return (data?.display_name as string | null) ?? "Sem nome";
}

type HumanReviewResultRow = {
  id: string;
  case_id: string;
  execution_id: string;
  reviewer_id: string;
  reviewed_at: string;
  review_status: HumanReviewResultRecord["reviewStatus"];
  review_action: ReviewAction;
  original_shortlist_artifact_id: string;
  original_shortlist_artifact_version: number;
  compatibility_matrix_artifact_id: string;
  compatibility_matrix_artifact_version: number;
  approved_provider_ids: string[];
  changes: ProviderChange[];
  review_rationale: string;
  evidence_references: string[];
  return_to_protocol: ProtocolId | null;
  method_version: string;
  version: number;
  created_at: string;
};

const HUMAN_REVIEW_RESULT_COLUMNS =
  "id, case_id, execution_id, reviewer_id, reviewed_at, review_status, review_action, original_shortlist_artifact_id, original_shortlist_artifact_version, compatibility_matrix_artifact_id, compatibility_matrix_artifact_version, approved_provider_ids, changes, review_rationale, evidence_references, return_to_protocol, method_version, version, created_at";

async function mapRow(supabase: SupabaseClient, row: HumanReviewResultRow): Promise<HumanReviewResultRecord> {
  return {
    id: row.id,
    caseId: row.case_id,
    executionId: row.execution_id,
    reviewerId: row.reviewer_id,
    reviewerName: await nameByProfileId(supabase, row.reviewer_id),
    reviewedAt: row.reviewed_at,
    reviewStatus: row.review_status,
    reviewAction: row.review_action,
    originalShortlistArtifactId: row.original_shortlist_artifact_id,
    originalShortlistArtifactVersion: row.original_shortlist_artifact_version,
    compatibilityMatrixArtifactId: row.compatibility_matrix_artifact_id,
    compatibilityMatrixArtifactVersion: row.compatibility_matrix_artifact_version,
    approvedProviderIds: row.approved_provider_ids,
    changes: row.changes,
    reviewRationale: row.review_rationale,
    evidenceReferences: row.evidence_references,
    returnToProtocol: row.return_to_protocol,
    methodVersion: row.method_version,
    version: row.version,
    createdAt: row.created_at,
  };
}

// Mais recente primeiro — a decisão vigente de um Caso é sempre a última
// linha; decisões anteriores (ex.: um REJECT seguido depois de um APPROVE)
// nunca desaparecem do histórico.
export async function listHumanReviewResultsForCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<HumanReviewResultRecord[]> {
  const { data, error } = await supabase
    .from("human_review_results")
    .select(HUMAN_REVIEW_RESULT_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar o histórico de revisão humana.");
  }

  return Promise.all((data as HumanReviewResultRow[]).map((row) => mapRow(supabase, row)));
}

export async function getLatestHumanReviewResultForCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<HumanReviewResultRecord | null> {
  const results = await listHumanReviewResultsForCase(supabase, caseId);
  return results[0] ?? null;
}

export type SubmitHumanReviewInput = {
  caseId: string;
  reviewerId: string;
  reviewAction: ReviewAction;
  reviewRationale: string;
  evidenceReferences: string[];
  changes: ProviderChange[];
  returnToProtocol: ProtocolId | null;
};

export type SubmitHumanReviewResult =
  | { outcome: "recorded"; result: HumanReviewResultRecord }
  | { outcome: "error"; error: string };

// O ACE nunca decide — este código só transporta a decisão já tomada por um
// humano autorizado até o protocolo P009 (que valida a CONSISTÊNCIA
// estrutural dessa decisão, nunca a decisão em si) e persiste o resultado.
// Uma vez que o Caso já tem uma decisão VALIDATED, uma nova revisão não é
// aceita — reabrir uma curadoria já validada é uma decisão de produto fora
// do escopo desta sprint (P010 ainda não existe para consumir isso).
export async function submitHumanReview(
  supabase: SupabaseClient,
  input: SubmitHumanReviewInput,
): Promise<SubmitHumanReviewResult> {
  const kase = await getCase(supabase, input.caseId);
  if (!kase) {
    return { outcome: "error", error: "Caso não encontrado." };
  }

  if (kase.status !== "HUMAN_REVIEW") {
    return {
      outcome: "error",
      error: 'O caso precisa estar em "Em revisão humana" para registrar uma decisão.',
    };
  }

  const existing = await listHumanReviewResultsForCase(supabase, input.caseId);
  if (existing.some((result) => result.reviewStatus === "VALIDATED")) {
    return {
      outcome: "error",
      error: "Este caso já tem uma curadoria validada — não é possível registrar uma nova decisão.",
    };
  }

  const execution = await getLatestExecution(supabase, input.caseId);
  if (!execution) {
    return { outcome: "error", error: "Nenhuma execução do ACE encontrada para este caso." };
  }

  const [shortlistArtifact, compatibilityMatrixArtifact] = await Promise.all([
    getLatestArtifactByType(supabase, input.caseId, "Shortlist"),
    getLatestArtifactByType(supabase, input.caseId, "CompatibilityMatrix"),
  ]);

  if (!shortlistArtifact || !compatibilityMatrixArtifact) {
    return { outcome: "error", error: "Shortlist ou CompatibilityMatrix não encontrada para este caso." };
  }

  let humanReviewResult;
  try {
    humanReviewResult = await p009HumanReview.execute({
      shortlist: shortlistArtifact.payload as Shortlist,
      compatibilityMatrix: compatibilityMatrixArtifact.payload as CompatibilityMatrix,
      reviewerId: input.reviewerId,
      reviewAction: input.reviewAction,
      reviewRationale: input.reviewRationale,
      evidenceReferences: input.evidenceReferences,
      changes: input.changes,
      returnToProtocol: input.returnToProtocol,
    });
  } catch (error) {
    if (error instanceof ProtocolError) {
      return { outcome: "error", error: error.message };
    }
    return { outcome: "error", error: "Não foi possível registrar a decisão agora." };
  }

  const { data, error } = await supabase
    .from("human_review_results")
    .insert({
      id: humanReviewResult.id,
      case_id: input.caseId,
      execution_id: execution.id,
      reviewer_id: humanReviewResult.reviewerId,
      reviewed_at: humanReviewResult.reviewedAt,
      review_status: humanReviewResult.reviewStatus,
      review_action: humanReviewResult.reviewAction,
      original_shortlist_artifact_id: humanReviewResult.originalShortlistReference.artifactId,
      original_shortlist_artifact_version: humanReviewResult.originalShortlistReference.artifactVersion,
      compatibility_matrix_artifact_id: humanReviewResult.compatibilityMatrixReference.artifactId,
      compatibility_matrix_artifact_version: humanReviewResult.compatibilityMatrixReference.artifactVersion,
      approved_provider_ids: humanReviewResult.approvedProviderIds,
      changes: humanReviewResult.changes,
      review_rationale: humanReviewResult.reviewRationale,
      evidence_references: humanReviewResult.evidenceReferences,
      return_to_protocol: humanReviewResult.returnToProtocol,
      method_version: humanReviewResult.methodVersion,
      version: humanReviewResult.version,
    })
    .select(HUMAN_REVIEW_RESULT_COLUMNS)
    .single();

  if (error || !data) {
    // 23505 = violação da constraint única human_review_results_one_validated_per_case_idx
    // (duas decisões VALIDATED concorrentes para o mesmo Caso) — mesma
    // mensagem já usada no pre-check acima (linha ~140), nunca um throw cru
    // escapando sem tratamento pela Server Action.
    if (error?.code === "23505") {
      return {
        outcome: "error",
        error: "Este caso já tem uma curadoria validada — não é possível registrar uma nova decisão.",
      };
    }
    throw new Error("Não foi possível persistir a decisão do Human Review.");
  }

  // REJECTED/INFORMATION_REQUESTED: o caso volta a aguardar informação —
  // alguém da equipe precisa agir antes de uma nova revisão ser possível.
  // VALIDATED: o caso permanece em HUMAN_REVIEW nesta sprint (a transição
  // para entrega é escopo do P010, ainda não implementado).
  if (humanReviewResult.reviewStatus !== "VALIDATED") {
    await changeCaseStatus(supabase, input.caseId, "WAITING_FOR_INFORMATION", input.reviewerId);
  }

  const record = await mapRow(supabase, data as HumanReviewResultRow);
  return { outcome: "recorded", result: record };
}
