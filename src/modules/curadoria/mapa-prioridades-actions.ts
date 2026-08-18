"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { isImportanceLevel, type ImportanceLevel } from "./mapa-prioridades";
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
  return savePriorityImportancesAction({
    caseId: input.caseId,
    entries: [
      {
        subcriterionCode: input.subcriterionCode,
        importance: input.importance,
      },
    ],
  });
}

/**
 * Grava uma revisão inteira do Mapa em um único ato.
 *
 * A interface mantém o rascunho local enquanto a conversa acontece e envia
 * apenas as classificações alteradas. A validação continua item a item e o
 * `upsert` do repositório permanece uma única instrução: ou o lote válido é
 * aceito, ou nenhuma classificação do lote é gravada.
 */
export async function savePriorityImportancesAction(input: {
  caseId: string;
  entries: { subcriterionCode: string; importance: string }[];
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRoleForAction("curador_medico");
  } catch {
    return {
      success: false,
      error: "Só quem conduz este Case registra o Mapa de Prioridades.",
    };
  }

  if (!input.caseId || input.entries.length === 0) {
    return { success: false, error: "Não há alterações do Mapa para gravar." };
  }

  const entries: { subcriterionCode: string; importance: ImportanceLevel }[] =
    [];
  for (const entry of input.entries) {
    if (!entry.subcriterionCode) {
      return {
        success: false,
        error: "Faltou identificar um dos subcritérios.",
      };
    }
    if (!isImportanceLevel(entry.importance)) {
      return {
        success: false,
        error: `"${entry.importance}" não é um nível do Método. Escolha entre Muito importante, Importante, Relevante, Pouco importante e Não influencia este caso.`,
      };
    }
    entries.push({
      subcriterionCode: entry.subcriterionCode,
      importance: entry.importance,
    });
  }

  const supabase = await createServerSupabaseClient();

  try {
    await savePriorityMapEntries(supabase, input.caseId, entries);
  } catch (erro) {
    return {
      success: false,
      error: erro instanceof Error ? erro.message : "Não foi possível gravar.",
    };
  }

  revalidatePath(`/coa/curadoria/casos/${input.caseId}/curadoria_tecnica`);
  return { success: true };
}
