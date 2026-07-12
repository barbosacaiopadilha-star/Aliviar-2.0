"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases/repository";

import { submitHumanReview } from "./human-review-repository";
import { submitHumanReviewInputSchema, type SubmitHumanReviewFormInput } from "./human-review-schema";
import type { ConciergeActionResult } from "./types";

// Único ponto de entrada para registrar uma decisão do P009 — sempre a
// partir de um envio explícito do formulário de revisão por um
// Administrador ou Curador Médico autorizado. O ACE nunca decide sozinho;
// esta action apenas autentica quem decidiu e repassa a decisão já tomada.
export async function submitHumanReviewAction(input: SubmitHumanReviewFormInput): Promise<ConciergeActionResult> {
  const parsed = submitHumanReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  const kase = await getCase(supabase, parsed.data.caseId);
  if (!kase) {
    return { success: false, error: "Caso não encontrado." };
  }

  // Mesma regra do início/retomada da execução do ACE: um Curador Médico só
  // revisa um Caso atribuído a ele mesmo, nunca o de outro responsável
  // (reforçado também por RLS em human_review_results).
  const isAdmin = authState.roles.includes("administrador");
  if (!isAdmin && kase.assignedCuratorId !== authState.user.id) {
    return { success: false, error: "Você só pode revisar casos atribuídos a você." };
  }

  const { reviewAction, reviewRationale, caseId } = parsed.data;
  const evidenceReferences = parsed.data.evidenceReferences ?? [];
  const changes = reviewAction === "ADJUST" ? parsed.data.changes : [];
  const returnToProtocol =
    reviewAction === "REJECT" || reviewAction === "REQUEST_MORE_INFORMATION" ? (parsed.data.returnToProtocol ?? null) : null;

  const result = await submitHumanReview(supabase, {
    caseId,
    reviewerId: authState.user.id,
    reviewAction,
    reviewRationale,
    evidenceReferences,
    changes,
    returnToProtocol,
  });

  if (result.outcome === "error") {
    return { success: false, error: result.error };
  }

  revalidatePath(`/admin/casos/${caseId}`);
  revalidatePath(`/admin/casos/${caseId}/revisao`);
  revalidatePath(`/curador/casos/${caseId}`);
  revalidatePath(`/curador/casos/${caseId}/revisao`);
  revalidatePath("/paciente");

  return { success: true };
}
