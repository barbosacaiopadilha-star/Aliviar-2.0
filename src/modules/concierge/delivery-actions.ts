"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases/repository";

import { deliverFinalCuradoria } from "./delivery-repository";
import { getAceLanguageModel } from "./language-model";
import type { ConciergeActionResult } from "./types";

// Única ação para entregar a Curadoria — sempre a partir de um clique
// explícito de um Administrador ou Curador Médico autorizado sobre um
// Caso já com uma decisão humana validada. Nunca automático.
export async function deliverFinalCuradoriaAction(caseId: string): Promise<ConciergeActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  const kase = await getCase(supabase, caseId);
  if (!kase) {
    return { success: false, error: "Caso não encontrado." };
  }

  const isAdmin = authState.roles.includes("administrador");
  if (!isAdmin && kase.assignedCuratorId !== authState.user.id) {
    return { success: false, error: "Você só pode entregar a Curadoria de casos atribuídos a você." };
  }

  const result = await deliverFinalCuradoria({
    supabase,
    caseId,
    actorId: authState.user.id,
    languageModel: await getAceLanguageModel(),
  });

  if (result.outcome === "error") {
    return { success: false, error: result.error };
  }

  revalidatePath(`/admin/casos/${caseId}`);
  revalidatePath(`/admin/casos/${caseId}/revisao`);
  revalidatePath(`/curador/casos/${caseId}`);
  revalidatePath(`/curador/casos/${caseId}/revisao`);
  revalidatePath("/paciente");
  revalidatePath("/paciente/curadoria");

  return { success: true };
}
