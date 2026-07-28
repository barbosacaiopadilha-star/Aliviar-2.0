"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import { DECISION_MESSAGES } from "@/modules/curadoria/reconhecimento-do-perfil";

/**
 * O ATO DELA — ADR-042.
 *
 * "A paciente confirmou que o Mapa de Prioridades reflete o que foi
 * compreendido durante a Consulta Inicial."
 *
 * O que mudou em relação a `validateProfileAction`, que esta ação substitui:
 *
 *   dono ......... exigia `requireCurator()`. O ato que o Método define como
 *                  dela só podia ser feito por outra pessoa.
 *   condição ..... exigia `readiness.canValidate`, isto é, os 100 pontos de
 *                  `priority_weights` somando exatamente 100.
 *   agora ........ é dela, e depende só do Mapa de Prioridades estar completo.
 *
 * Não existe aqui: soma de pontos, `priority_weights`, `cruzamento_weights`,
 * campo livre obrigatório, nem comparação com a string "VALIDATED" — a
 * decisão inteira vive no banco, numa função que faz uma coisa só.
 */
export type ReconhecimentoResult =
  | { success: true; jaEstava: boolean }
  | { success: false; error: string };

/**
 * Cada código que a função do banco devolve vira uma frase que fala com ela.
 * "MAPA_INCOMPLETO" não é erro dela — é estado do trabalho da Curadoria, e a
 * mensagem diz isso.
 */
const MENSAGENS: Record<string, string> = {
  NAO_AUTORIZADO: "Este Perfil não é seu.",
  PERFIL_INEXISTENTE:
    "O seu Perfil ainda não foi aberto. Ele nasce na Consulta Inicial, junto com a Curadoria.",
  MAPA_INCOMPLETO: DECISION_MESSAGES.MAPA_INCOMPLETO,
  PERFIL_SUBSTITUIDO: DECISION_MESSAGES.PERFIL_SUBSTITUIDO,
};

export async function reconhecerPerfilAction(input: {
  caseId: string;
}): Promise<ReconhecimentoResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Este Perfil não é seu." };
  }

  if (!input.caseId) {
    return { success: false, error: "Faltou identificar o Case." };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("acknowledge_priority_profile", {
    _case_id: input.caseId,
  });

  if (error) {
    return { success: false, error: "Não foi possível registrar agora. Tente de novo." };
  }

  // Idempotência: reconhecer duas vezes não é falha. A tela diz que já estava
  // feito em vez de acusar erro por algo que ela fez certo.
  if (data === "RECONHECIDO" || data === "JA_RECONHECIDO") {
    revalidatePath("/portal-paciente");
    revalidatePath("/portal-paciente/prioridades");
    return { success: true, jaEstava: data === "JA_RECONHECIDO" };
  }

  return {
    success: false,
    error: MENSAGENS[data as string] ?? "Não foi possível registrar agora.",
  };
}
