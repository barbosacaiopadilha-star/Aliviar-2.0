"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import { inspectDeclaredText, type ContentIssue } from "./content-guard";
import { OBSERVATION_KINDS, PATIENT_QUESTIONS, PROFESSIONAL_QUESTIONS } from "./types";

export type BriefingActionResult =
  | { success: true }
  /**
   * `issues` só aparece quando o guard de conteúdo encontrou algo. O texto NÃO
   * é salvo e NÃO é reescrito — volta inteiro para quem escreveu decidir.
   */
  | { success: false; error: string; issues?: ContentIssue[] };

const recordPatientAnswerSchema = z.object({
  caseId: z.string().uuid(),
  questionId: z.enum(PATIENT_QUESTIONS),
  option: z.string().min(1),
  // A fala preservada. Opcional porque nem toda resposta tem frase — mas
  // quando existe, ela tem precedência sobre o rótulo da opção.
  verbatim: z.string().trim().max(2000).optional(),
});

/**
 * Registra uma resposta do Perfil de Alinhamento do paciente.
 *
 * @metodo ALIGNMENT_PROFILE §1 — as 5 perguntas aprovadas, nenhuma a mais
 *
 * Quem registra é a equipe, durante a Consulta Inicial — as perguntas pedem
 * confiança já estabelecida, não um formulário público. Todas são opcionais:
 * um Case sem Perfil de Alinhamento é um Case perfeitamente válido.
 */
export async function recordPatientAnswerAction(input: unknown): Promise<BriefingActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = recordPatientAnswerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("alignment_patient_answers").upsert(
    {
      case_id: parsed.data.caseId,
      question_id: parsed.data.questionId,
      option: parsed.data.option,
      verbatim: parsed.data.verbatim?.trim() || null,
      recorded_by: authState.user.id,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "case_id,question_id" },
  );

  if (error) return { success: false, error: "Não foi possível registrar a resposta." };

  revalidatePath(`/portal-curador/casos/${parsed.data.caseId}`);
  return { success: true };
}

const recordObservationSchema = z.object({
  caseId: z.string().uuid(),
  kind: z.enum(OBSERVATION_KINDS),
  note: z
    .string()
    .trim()
    .min(1, "Escreva o que observou.")
    .max(2000, "Texto muito longo."),
});

/**
 * Registra uma observação do Curador.
 *
 * @metodo ALIGNMENT_PROFILE §3 — sobre situação, nunca sobre essência
 *
 * A observação pertence ao Case: não existe caminho para vinculá-la ao
 * paciente ou ao profissional como sujeito permanente. O autor vem da
 * sessão, nunca do cliente.
 */
export async function recordObservationAction(input: unknown): Promise<BriefingActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = recordObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("curator_observations").insert({
    case_id: parsed.data.caseId,
    kind: parsed.data.kind,
    note: parsed.data.note,
    author_id: authState.user.id,
  });

  if (error) return { success: false, error: "Não foi possível registrar a observação." };

  revalidatePath(`/portal-curador/casos/${parsed.data.caseId}`);
  return { success: true };
}

const reviseObservationSchema = z.object({
  observationId: z.string().uuid(),
  caseId: z.string().uuid(),
  note: z.string().trim().min(1, "Escreva o que observou.").max(2000, "Texto muito longo."),
});

/**
 * O autor corrige a própria observação.
 *
 * @metodo ACE_PRINCIPLES P8 — direito à revisão
 *
 * Não recebe autor do cliente: a RLS exige `author_id = auth.uid()`, então
 * corrigir a observação de outra pessoa não retorna linha nenhuma.
 */
export async function reviseObservationAction(input: unknown): Promise<BriefingActionResult> {
  try {
    await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = reviseObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("curator_observations")
    .update({ note: parsed.data.note })
    .eq("id", parsed.data.observationId)
    .select("id");

  if (error) return { success: false, error: "Não foi possível salvar a correção." };
  if (!data || data.length === 0) {
    return { success: false, error: "Só quem escreveu a observação pode corrigi-la." };
  }

  revalidatePath(`/portal-curador/casos/${parsed.data.caseId}`);
  return { success: true };
}

const removeObservationSchema = z.object({
  observationId: z.string().uuid(),
  caseId: z.string().uuid(),
});

/**
 * O autor remove a própria observação.
 *
 * Por que remover precisa existir: se alguém escreveu sem querer um rótulo
 * sobre a pessoa, manter isso registrado é pior que apagar (P10, P11).
 * Não é registro de auditoria — esse é `case_responsibility_changes`.
 */
export async function removeObservationAction(input: unknown): Promise<BriefingActionResult> {
  try {
    await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = removeObservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("curator_observations")
    .delete()
    .eq("id", parsed.data.observationId)
    .select("id");

  if (error) return { success: false, error: "Não foi possível remover a observação." };
  if (!data || data.length === 0) {
    return { success: false, error: "Só quem escreveu a observação pode removê-la." };
  }

  revalidatePath(`/portal-curador/casos/${parsed.data.caseId}`);
  return { success: true };
}

const removePatientAnswerSchema = z.object({
  caseId: z.string().uuid(),
  questionId: z.enum(PATIENT_QUESTIONS),
});

/**
 * Retira uma resposta do Perfil de Alinhamento.
 *
 * @metodo ACE_PRINCIPLES P8 — a pessoa pode voltar atrás
 *
 * Se o paciente pedir para retirar o que disse, a equipe registra a retirada.
 * Voltar ao estado "ainda não registrado" é um estado legítimo, não uma falha.
 */
export async function removePatientAnswerAction(input: unknown): Promise<BriefingActionResult> {
  try {
    await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = removePatientAnswerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("alignment_patient_answers")
    .delete()
    .eq("case_id", parsed.data.caseId)
    .eq("question_id", parsed.data.questionId);

  if (error) return { success: false, error: "Não foi possível retirar a resposta." };

  revalidatePath(`/portal-curador/casos/${parsed.data.caseId}`);
  return { success: true };
}

const declareProfessionalSchema = z
  .object({
    questionId: z.enum(PROFESSIONAL_QUESTIONS),
    option: z.string().min(1).optional(),
    declaredText: z.string().trim().max(2000).optional(),
  })
  .refine((v) => Boolean(v.option) || Boolean(v.declaredText?.trim()), {
    message: "Escolha uma opção ou escreva sua resposta.",
  });

/**
 * O próprio profissional declara como conduz seus pacientes.
 *
 * @metodo ACE_PRINCIPLES P8 — direito à revisão: nada sobre ele é imutável
 *
 * Só o dono do perfil escreve aqui (reforçado pela RLS). Nenhuma resposta
 * vira nota, e nenhuma é comparada com a de outro profissional.
 */
export async function declareProfessionalAnswerAction(input: unknown): Promise<BriefingActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["profissional", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = declareProfessionalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // GUARD DE CONTEÚDO — roda no servidor porque a verificação do cliente é
  // conveniência, nunca fronteira. Se encontrar algo, nada é salvo e nada é
  // reescrito: o texto volta para o profissional junto com o motivo.
  const declared = parsed.data.declaredText?.trim();
  if (declared) {
    const issues = inspectDeclaredText(declared);
    if (issues.length > 0) {
      return {
        success: false,
        error: "Antes de salvar, dê uma olhada nestes trechos:",
        issues,
      };
    }
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("alignment_professional_answers").upsert(
    {
      professional_profile_id: authState.user.id,
      question_id: parsed.data.questionId,
      option: parsed.data.option ?? null,
      declared_text: parsed.data.declaredText?.trim() || null,
      declared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "professional_profile_id,question_id" },
  );

  if (error) return { success: false, error: "Não foi possível registrar sua resposta." };

  revalidatePath("/profissional");
  return { success: true };
}
