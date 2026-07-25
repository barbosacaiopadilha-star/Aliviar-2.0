import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSuggestions, hasBothSides } from "./suggestions";
import type {
  BriefingSuggestion,
  CuradoriaBriefingData,
  CuratorObservation,
  ObservationKind,
  PatientAlignmentAnswer,
  PatientQuestionId,
  ProfessionalAlignmentAnswer,
  ProfessionalQuestionId,
} from "./types";

/**
 * Leitura do Briefing. Nenhuma escrita em tabela do domínio — esta camada
 * só lê o que é dela e o que o Case já expõe.
 *
 * A RLS decide o que este usuário alcança (can_access_case). Não há filtro
 * de autorização aqui: repetir a regra no TypeScript criaria uma segunda
 * autoridade que pode divergir da primeira.
 */

export async function listPatientAnswers(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PatientAlignmentAnswer[]> {
  const { data } = await supabase
    .from("alignment_patient_answers")
    .select("question_id, option, verbatim, answered_at")
    .eq("case_id", caseId);

  return ((data ?? []) as Record<string, string | null>[]).map((row) => ({
    questionId: row.question_id as PatientQuestionId,
    option: row.option as string,
    verbatim: row.verbatim,
    answeredAt: row.answered_at as string,
    dataClass: "PREFERENCIA",
    origin: "PACIENTE",
  }));
}

export async function listProfessionalAnswers(
  supabase: SupabaseClient,
  professionalProfileIds: string[],
): Promise<Map<string, ProfessionalAlignmentAnswer[]>> {
  const result = new Map<string, ProfessionalAlignmentAnswer[]>();
  if (professionalProfileIds.length === 0) return result;

  const { data } = await supabase
    .from("alignment_professional_answers")
    .select("professional_profile_id, question_id, option, declared_text, declared_at")
    .in("professional_profile_id", professionalProfileIds);

  for (const row of (data ?? []) as Record<string, string | null>[]) {
    const key = row.professional_profile_id as string;
    const entry: ProfessionalAlignmentAnswer = {
      questionId: row.question_id as ProfessionalQuestionId,
      option: row.option,
      declaredText: row.declared_text,
      declaredAt: row.declared_at as string,
      dataClass: "FATO",
      origin: "MEDICO",
    };
    result.set(key, [...(result.get(key) ?? []), entry]);
  }
  return result;
}

/**
 * As declarações do próprio profissional autenticado.
 *
 * Sem argumento de id: a RLS já restringe a linha a `auth.uid()`. Aceitar um
 * id aqui criaria um caminho para ler o de outra pessoa se a RLS afrouxar.
 */
export async function listOwnProfessionalAnswers(
  supabase: SupabaseClient,
): Promise<ProfessionalAlignmentAnswer[]> {
  const { data } = await supabase
    .from("alignment_professional_answers")
    .select("question_id, option, declared_text, declared_at, updated_at");

  return ((data ?? []) as Record<string, string | null>[]).map((row) => ({
    questionId: row.question_id as ProfessionalQuestionId,
    option: row.option,
    declaredText: row.declared_text,
    declaredAt: (row.updated_at ?? row.declared_at) as string,
    dataClass: "FATO",
    origin: "MEDICO",
  }));
}

export async function listCuratorObservations(
  supabase: SupabaseClient,
  caseId: string,
): Promise<CuratorObservation[]> {
  const { data } = await supabase
    .from("curator_observations")
    .select("id, case_id, kind, note, author_id, observed_at, profiles!curator_observations_author_id_fkey(display_name)")
    .eq("case_id", caseId)
    .order("observed_at", { ascending: false });

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
    const author = row.profiles as { display_name: string } | { display_name: string }[] | null;
    const authorName = Array.isArray(author) ? author[0]?.display_name : author?.display_name;
    return {
      id: row.id as string,
      caseId: row.case_id as string,
      kind: row.kind as ObservationKind,
      note: row.note as string,
      authorId: row.author_id as string,
      authorName: authorName ?? "Curador",
      observedAt: row.observed_at as string,
      dataClass: "INTERPRETACAO",
      origin: "CURADOR",
    };
  });
}

/**
 * Monta o Briefing completo de um Case.
 *
 * `professionals` são as opções em avaliação — vêm de quem chamou (a fase de
 * Curadoria Técnica), porque esta camada NUNCA seleciona profissional.
 */
export async function loadBriefing(
  supabase: SupabaseClient,
  caseId: string,
  patientFirstName: string,
  professionals: { profileId: string; displayName: string }[],
): Promise<CuradoriaBriefingData> {
  const [patientAnswers, professionalAnswers, observations] = await Promise.all([
    listPatientAnswers(supabase, caseId),
    listProfessionalAnswers(supabase, professionals.map((p) => p.profileId)),
    listCuratorObservations(supabase, caseId),
  ]);

  const professionalNames = new Map(professionals.map((p) => [p.profileId, p.displayName]));

  // Sugestões por profissional — na ordem em que a fase de Curadoria os
  // entregou. Esta camada não reordena nada: ordenar seria opinar sobre
  // preferência, e isso é do Curador.
  const suggestions: BriefingSuggestion[] = [];
  for (const professional of professionals) {
    suggestions.push(
      ...buildSuggestions({
        patientAnswers,
        professionalAnswers: professionalAnswers.get(professional.profileId) ?? [],
        professionalName: professional.displayName,
        observations,
      }),
    );
  }

  // Sem profissional em avaliação, ainda vale mostrar lacunas e observações.
  if (professionals.length === 0) {
    suggestions.push(
      ...buildSuggestions({
        patientAnswers,
        professionalAnswers: [],
        professionalName: "",
        observations,
      }).filter((s) => s.kind === "LACUNA" || s.evidence.some((e) => e.origin === "CURADOR")),
    );
  }

  return {
    caseId,
    patientFirstName,
    patientAnswers,
    professionalAnswers,
    professionalNames,
    observations,
    // Guard final: sugestão sem as duas pontas não chega à tela.
    suggestions: suggestions.filter(hasBothSides),
  };
}
