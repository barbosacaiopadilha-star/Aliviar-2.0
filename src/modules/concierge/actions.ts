"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases/repository";

import { getAceLanguageModel } from "./language-model";
import { runAceExecution } from "./orchestrator";
import type { ConciergeActionResult } from "./types";

// Único ponto de entrada para iniciar OU retomar uma execução — o
// orquestrador já decide internamente qual dos dois fazer a partir do
// estado persistido (ÉPICO 1/SPRINT 3: "permitir retomada sem repetir
// etapas concluídas"). O ACE nunca inicia sozinho: esta action só roda a
// partir de um clique explícito de um Administrador ou Curador Médico
// autorizado.
export async function runAceExecutionAction(caseId: string): Promise<ConciergeActionResult> {
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

  // Curador Médico só executa um Caso atribuído a ele mesmo — nunca o de
  // outro responsável (reforçado também por RLS em ace_executions/
  // ace_artifacts, esta é a checagem de aplicação com mensagem clara).
  const isAdmin = authState.roles.includes("administrador");
  if (!isAdmin && kase.assignedCuratorId !== authState.user.id) {
    return { success: false, error: "Você só pode executar o ACE em casos atribuídos a você." };
  }

  const result = await runAceExecution({
    supabase,
    caseId,
    actorId: authState.user.id,
    languageModel: await getAceLanguageModel(),
  });

  revalidatePath(`/admin/casos/${caseId}`);
  revalidatePath(`/curador/casos/${caseId}`);
  revalidatePath("/paciente");

  switch (result.outcome) {
    case "completed":
    case "blocked":
    case "failed":
      return { success: true };
    case "error":
      return { success: false, error: result.error };
  }
}
