import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A Curadoria entregue, do ponto de vista do paciente.
 *
 * @metodo Ontologia §3.12 — o Relatório nunca contém score interno nem linguagem de ranking
 * @metodo Ontologia §3.13 — a ordem é de apresentação, nunca colocação
 * @metodo Experience §6 — não existe “versão do paciente” de um artefato: existe o mesmo, menos o que é interno
 *
 * Por que existe: o paciente precisava de um caminho para LER o que foi escrito
 * para ele e para REGISTRAR a própria decisão. A RLS já permitia as duas coisas
 * (`reports_select_patient_delivered`, `patient_decisions_insert_patient`) e não
 * havia leitura nenhuma no código — a decisão dele só existia via SQL.
 *
 * O que NUNCA atravessa: score interno, cobertura de cadastro, quem foi
 * eliminado, banda técnica. Nada aqui seleciona nem ordena por qualidade — a
 * ordem é a que o Curador escreveu.
 */

export type PatientCuradoriaOption = {
  id: string;
  professionalProfileId: string;
  professionalName: string;
  justification: string;
  relationToWeights: string;
  attentionPoints: string[];
  suggestedQuestions: string[];
};

export type PatientCuradoria = {
  curatedSelectionId: string;
  curatorName: string | null;
  deliveredAt: string;
  compositionRationale: string | null;
  options: PatientCuradoriaOption[];
  decision: {
    outcome: "CHOSEN" | "NONE_OF_THEM";
    chosenName: string | null;
    decidedAt: string;
  } | null;
};

/**
 * Lê a Curadoria entregue a este paciente. A RLS decide o que ele alcança —
 * não há filtro de autorização aqui, para não criar uma segunda autoridade.
 */
export async function loadPatientCuradoria(
  supabase: SupabaseClient,
): Promise<PatientCuradoria | null> {
  const { data: selection } = await supabase
    .from("curated_selections")
    .select("id, case_id, composition_rationale, delivered_at, status")
    .eq("status", "DELIVERED")
    .order("delivered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!selection?.delivered_at) return null;

  const selectionId = selection.id as string;

  const { data: report } = await supabase
    .from("curadoria_reports")
    .select("id, composition_rationale, delivered_at")
    .eq("curated_selection_id", selectionId)
    .maybeSingle();

  if (!report?.delivered_at) return null;

  const [{ data: optionRows }, { data: selectionOptions }, { data: decisionRow }] = await Promise.all([
    supabase
      .from("curadoria_report_options")
      .select(
        "id, professional_profile_id, position, justification, relation_to_weights, attention_points, suggested_questions",
      )
      .eq("report_id", report.id as string)
      .order("position"),
    supabase
      .from("curated_selection_options")
      .select("id, professional_profile_id")
      .eq("curated_selection_id", selectionId),
    supabase
      .from("patient_curadoria_decisions")
      .select("outcome, chosen_option_id, decided_at")
      .eq("curated_selection_id", selectionId)
      .maybeSingle(),
  ]);

  const professionalIds = (optionRows ?? []).map((row) => row.professional_profile_id as string);
  const { data: profiles } = professionalIds.length
    ? await supabase
        .from("professional_profiles")
        .select("id, display_name")
        .in("id", professionalIds)
    : { data: [] };

  const nameById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  // A decisão aponta para a OPÇÃO da seleção, não para o profissional.
  const selectionOptionToProfessional = new Map(
    (selectionOptions ?? []).map((row) => [
      row.id as string,
      row.professional_profile_id as string,
    ]),
  );

  const options: PatientCuradoriaOption[] = (optionRows ?? []).map((row) => {
    const professionalProfileId = row.professional_profile_id as string;
    const selectionOptionId =
      [...selectionOptionToProfessional.entries()].find(
        ([, professional]) => professional === professionalProfileId,
      )?.[0] ?? (row.id as string);

    return {
      id: selectionOptionId,
      professionalProfileId,
      professionalName: nameById.get(professionalProfileId) ?? "Profissional",
      justification: (row.justification as string) ?? "",
      relationToWeights: (row.relation_to_weights as string) ?? "",
      attentionPoints: (row.attention_points as string[]) ?? [],
      suggestedQuestions: (row.suggested_questions as string[]) ?? [],
    };
  });

  const chosenProfessional = decisionRow?.chosen_option_id
    ? selectionOptionToProfessional.get(decisionRow.chosen_option_id as string)
    : null;

  return {
    curatedSelectionId: selectionId,
    curatorName: null,
    deliveredAt: report.delivered_at as string,
    compositionRationale:
      ((report.composition_rationale ?? selection.composition_rationale) as string | null) ?? null,
    options,
    decision: decisionRow
      ? {
          outcome: decisionRow.outcome as "CHOSEN" | "NONE_OF_THEM",
          chosenName: chosenProfessional ? (nameById.get(chosenProfessional) ?? null) : null,
          decidedAt: decisionRow.decided_at as string,
        }
      : null,
  };
}
