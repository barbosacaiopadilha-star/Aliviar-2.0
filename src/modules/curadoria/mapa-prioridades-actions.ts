"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { isImportanceLevel } from "./mapa-prioridades";
import { savePriorityMapEntries } from "./mapa-prioridades-repository";

/**
 * O Curador registra quanto um subcritério importa NESTE Case — ADR-042.
 *
 * Ele não cria, não renomeia e não descreve critério: escolhe um nível numa
 * escala fechada. Não existe campo livre nesta ação, e não existe ação de
 * "criar critério" nem de "validar critérios" — a completude é calculada.
 *
 * A RLS de `case_priority_map` já restringe a quem conduz o Case; o papel é
 * conferido aqui para a mensagem sair legível em vez de virar erro de banco.
 */
export async function savePriorityImportanceAction(input: {
  caseId: string;
  subcriterionCode: string;
  importance: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRoleForAction("curador_medico");
  } catch {
    return { success: false, error: "Só quem conduz este Case registra o Mapa de Prioridades." };
  }

  if (!input.caseId || !input.subcriterionCode) {
    return { success: false, error: "Faltou identificar o Case ou o subcritério." };
  }

  if (!isImportanceLevel(input.importance)) {
    return {
      success: false,
      error: `"${input.importance}" não é um nível do Método. Escolha entre Muito importante, Importante, Relevante, Pouco importante e Não influencia este caso.`,
    };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await savePriorityMapEntries(supabase, input.caseId, [
      { subcriterionCode: input.subcriterionCode, importance: input.importance },
    ]);
  } catch (erro) {
    return {
      success: false,
      error: erro instanceof Error ? erro.message : "Não foi possível gravar.",
    };
  }

  revalidatePath(`/coa/curadoria/casos/${input.caseId}/curadoria_tecnica`);
  return { success: true };
}
