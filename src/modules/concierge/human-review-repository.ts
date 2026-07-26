import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProviderChange, ReviewAction } from "@/modules/ace/artifacts/human-review-result";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";

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

export async function getLatestReturnProtocolForCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<ProtocolId | null> {
  const results = await listHumanReviewResultsForCase(supabase, caseId);
  const latest = results.find(
    (result) =>
      result.returnToProtocol !== null &&
      (result.reviewStatus === "REJECTED" || result.reviewStatus === "INFORMATION_REQUESTED"),
  );
  return latest?.returnToProtocol ?? null;
}

// A ESCRITA FOI REMOVIDA (ADR-036/ADR-037). `submitHumanReview` era o único
// escritor de `human_review_results` e existia para o P009, que deixou de ser
// cadeia decisória: a única autoridade decisória da Curadoria é o Curador, na
// Mesa. Restam aqui apenas leitores do histórico já persistido — nenhuma
// superfície da aplicação consegue registrar ou alterar uma revisão.
