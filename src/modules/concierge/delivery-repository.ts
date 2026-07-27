import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";

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

// A ESCRITA FOI REMOVIDA (ADR-036/ADR-037). `deliverFinalCuradoria` era o
// único escritor de `final_curadoria_deliveries` e existia para o P010, que
// deixou de ser cadeia decisória: o ACE não produz mais entrega, e a entrega
// canônica é a do Método (src/modules/curadoria/delivery-contract.ts).
// Restam aqui apenas leitores do histórico já persistido — nenhuma superfície
// da aplicação consegue inserir ou alterar uma entrega.
