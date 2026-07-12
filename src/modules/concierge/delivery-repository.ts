import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { ProviderPresentationRepository } from "@/modules/ace/ports/provider-presentation-repository";
import { p010FinalCuradoriaDelivery, type P010Presentation } from "@/modules/ace/protocols/p010-final-curadoria-delivery";

import { getCase, changeCaseStatus } from "@/modules/cases/repository";

import { getArtifactById } from "./execution-repository";
import { listHumanReviewResultsForCase } from "./human-review-repository";
import type { AceLanguageModel } from "./language-model";
import { SupabaseProviderPresentationRepository } from "./provider-adapters";
import type { FinalCuradoriaDeliveryRecord } from "./types";

async function nameByProfileId(supabase: SupabaseClient, profileId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", profileId).maybeSingle();
  return (data?.display_name as string | null) ?? "Sem nome";
}

const DELIVERY_COLUMNS =
  "id, case_id, patient_profile_id, human_review_result_id, validated_by, validated_at, delivered_by, delivered_at, generated_at, decision_summary, client_context_summary, provider_presentations, comparison_summary, relevant_limitations, relevant_missing_information, next_steps, method_explanation, disclaimer, method_version, version, created_at";

type DeliveryRow = {
  id: string;
  case_id: string;
  patient_profile_id: string;
  human_review_result_id: string;
  validated_by: string;
  validated_at: string;
  delivered_by: string;
  delivered_at: string;
  generated_at: string;
  decision_summary: string;
  client_context_summary: string;
  provider_presentations: ProviderPresentation[];
  comparison_summary: string;
  relevant_limitations: string[];
  relevant_missing_information: string[];
  next_steps: string[];
  method_explanation: string;
  disclaimer: string;
  method_version: string;
  version: number;
  created_at: string;
};

async function mapRow(supabase: SupabaseClient, row: DeliveryRow): Promise<FinalCuradoriaDeliveryRecord> {
  const [validatedByName, deliveredByName] = await Promise.all([
    nameByProfileId(supabase, row.validated_by),
    nameByProfileId(supabase, row.delivered_by),
  ]);

  return {
    id: row.id,
    caseId: row.case_id,
    patientProfileId: row.patient_profile_id,
    humanReviewResultId: row.human_review_result_id,
    validatedBy: row.validated_by,
    validatedByName,
    validatedAt: row.validated_at,
    deliveredBy: row.delivered_by,
    deliveredByName,
    deliveredAt: row.delivered_at,
    generatedAt: row.generated_at,
    decisionSummary: row.decision_summary,
    clientContextSummary: row.client_context_summary,
    providerPresentations: row.provider_presentations,
    comparisonSummary: row.comparison_summary,
    relevantLimitations: row.relevant_limitations,
    relevantMissingInformation: row.relevant_missing_information,
    nextSteps: row.next_steps,
    methodExplanation: row.method_explanation,
    disclaimer: row.disclaimer,
    methodVersion: row.method_version,
    version: row.version,
    createdAt: row.created_at,
  };
}

// No máximo uma entrega por Caso (índice único em final_curadoria_deliveries)
// — reabertura é fluxo próprio, fora do escopo desta sprint.
export async function getFinalCuradoriaDeliveryForCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<FinalCuradoriaDeliveryRecord | null> {
  const { data, error } = await supabase
    .from("final_curadoria_deliveries")
    .select(DELIVERY_COLUMNS)
    .eq("case_id", caseId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(supabase, data as DeliveryRow);
}

// Usado pelo Portal do Paciente — RLS já restringe a linha a quem é dono
// dela; aqui só resolvemos a mais recente, caso um dia um paciente tenha
// mais de um Caso entregue.
export async function getLatestFinalCuradoriaDeliveryForPatient(
  supabase: SupabaseClient,
  patientProfileId: string,
): Promise<FinalCuradoriaDeliveryRecord | null> {
  const { data, error } = await supabase
    .from("final_curadoria_deliveries")
    .select(DELIVERY_COLUMNS)
    .eq("patient_profile_id", patientProfileId)
    .order("delivered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(supabase, data as DeliveryRow);
}

export type DeliverFinalCuradoriaParams = {
  supabase: SupabaseClient;
  caseId: string;
  actorId: string;
  languageModel: AceLanguageModel;
  providerPresentationRepository?: ProviderPresentationRepository;
};

export type DeliverFinalCuradoriaResult =
  | { outcome: "delivered"; delivery: FinalCuradoriaDeliveryRecord }
  | { outcome: "error"; error: string };

// O P010 nunca decide — a decisão já ocorreu no P009. Este código só segue
// a cadeia de rastreabilidade já registrada (HumanReviewResult ->
// CompatibilityMatrix -> DecisionContext -> DecisionCase), busca os dados
// de apresentação institucional e monta a entrega. Uma vez entregue, o
// Caso nunca é entregue de novo automaticamente (índice único +
// verificação abaixo) — reabertura é fluxo próprio, fora do escopo desta
// sprint.
export async function deliverFinalCuradoria(params: DeliverFinalCuradoriaParams): Promise<DeliverFinalCuradoriaResult> {
  const { supabase, caseId, actorId, languageModel } = params;
  const providerPresentationRepository = params.providerPresentationRepository ?? new SupabaseProviderPresentationRepository(supabase);

  const kase = await getCase(supabase, caseId);
  if (!kase) {
    return { outcome: "error", error: "Caso não encontrado." };
  }

  const existingDelivery = await getFinalCuradoriaDeliveryForCase(supabase, caseId);
  if (existingDelivery) {
    return { outcome: "error", error: "A Curadoria deste caso já foi entregue anteriormente." };
  }

  const reviewResults = await listHumanReviewResultsForCase(supabase, caseId);
  const validatedReview = reviewResults.find((result) => result.reviewStatus === "VALIDATED");
  if (!validatedReview) {
    return { outcome: "error", error: "Este caso não tem uma decisão de revisão humana validada para entregar." };
  }

  const compatibilityMatrixArtifact = await getArtifactById(supabase, validatedReview.compatibilityMatrixArtifactId);
  if (!compatibilityMatrixArtifact) {
    return { outcome: "error", error: "A CompatibilityMatrix referenciada pela revisão não foi encontrada." };
  }
  const compatibilityMatrix = compatibilityMatrixArtifact.payload as CompatibilityMatrix;

  const decisionContextRef = compatibilityMatrix.sourceArtifacts.find((ref) => ref.artifactType === "DecisionContext");
  const decisionContextArtifact = decisionContextRef ? await getArtifactById(supabase, decisionContextRef.artifactId) : null;
  if (!decisionContextArtifact) {
    return { outcome: "error", error: "A cadeia de rastreabilidade está incompleta (DecisionContext ausente)." };
  }
  const decisionContext = decisionContextArtifact.payload as DecisionContext;

  const decisionCaseRef = decisionContext.sourceArtifacts.find((ref) => ref.artifactType === "DecisionCase");
  const decisionCaseArtifact = decisionCaseRef ? await getArtifactById(supabase, decisionCaseRef.artifactId) : null;
  if (!decisionCaseArtifact) {
    return { outcome: "error", error: "A cadeia de rastreabilidade está incompleta (DecisionCase ausente)." };
  }
  const decisionCase = decisionCaseArtifact.payload as DecisionCase;

  // Reconstitui o HumanReviewResult completo a partir do registro achatado
  // persistido em human_review_results — o P010 exige o objeto do artefato
  // do ACE, nunca a linha de banco; nada aqui é recalculado, só remontado.
  const humanReviewResult: HumanReviewResult = {
    id: validatedReview.id,
    version: validatedReview.version,
    createdAt: validatedReview.createdAt,
    producedBy: "P009",
    decisional: true,
    reviewerId: validatedReview.reviewerId,
    reviewedAt: validatedReview.reviewedAt,
    reviewStatus: validatedReview.reviewStatus,
    reviewAction: validatedReview.reviewAction,
    originalShortlistReference: {
      artifactId: validatedReview.originalShortlistArtifactId,
      artifactVersion: validatedReview.originalShortlistArtifactVersion,
      artifactType: "Shortlist",
    },
    compatibilityMatrixReference: {
      artifactId: validatedReview.compatibilityMatrixArtifactId,
      artifactVersion: validatedReview.compatibilityMatrixArtifactVersion,
      artifactType: "CompatibilityMatrix",
    },
    approvedProviderIds: validatedReview.approvedProviderIds,
    changes: validatedReview.changes,
    reviewRationale: validatedReview.reviewRationale,
    evidenceReferences: validatedReview.evidenceReferences,
    returnToProtocol: validatedReview.returnToProtocol,
    methodVersion: validatedReview.methodVersion,
  };

  const llmResponse = await languageModel.run<
    { decisionCase: DecisionCase; decisionContext: DecisionContext; humanReviewResult: HumanReviewResult },
    P010Presentation
  >({
    protocolId: "P010",
    protocolVersion: humanReviewResult.methodVersion,
    prompt: "p010-final-curadoria-delivery",
    input: { decisionCase, decisionContext, humanReviewResult },
  });

  if (llmResponse.metadata.status === "error" || !llmResponse.output) {
    return { outcome: "error", error: "Não foi possível gerar o conteúdo da entrega agora. Tente novamente." };
  }

  let finalCuradoria;
  try {
    finalCuradoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult,
      compatibilityMatrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository,
      presentation: llmResponse.output,
    });
  } catch (error) {
    if (error instanceof ProtocolError) {
      return { outcome: "error", error: error.message };
    }
    return { outcome: "error", error: "Não foi possível concluir a entrega agora." };
  }

  const { data, error } = await supabase
    .from("final_curadoria_deliveries")
    .insert({
      id: finalCuradoria.id,
      case_id: caseId,
      patient_profile_id: kase.patientProfileId,
      human_review_result_id: humanReviewResult.id,
      validated_by: finalCuradoria.validatedBy,
      validated_at: finalCuradoria.validatedAt,
      delivered_by: actorId,
      generated_at: finalCuradoria.generatedAt,
      decision_summary: finalCuradoria.decisionSummary,
      client_context_summary: finalCuradoria.clientContextSummary,
      provider_presentations: finalCuradoria.providerPresentations,
      comparison_summary: finalCuradoria.comparisonSummary,
      relevant_limitations: finalCuradoria.relevantLimitations,
      relevant_missing_information: finalCuradoria.relevantMissingInformation,
      next_steps: finalCuradoria.nextSteps,
      method_explanation: finalCuradoria.methodExplanation,
      disclaimer: finalCuradoria.disclaimer,
      method_version: finalCuradoria.methodVersion,
      version: finalCuradoria.version,
    })
    .select(DELIVERY_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Não foi possível persistir a entrega da Curadoria.");
  }

  await changeCaseStatus(supabase, caseId, "DELIVERED", actorId);

  const delivery = await mapRow(supabase, data as DeliveryRow);
  return { outcome: "delivered", delivery };
}
