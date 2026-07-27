import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CruzamentoCriterion } from "@/modules/curadoria/cruzamento";
import { buildPerfilView, type PerfilView } from "./experiencia";

/**
 * Carrega o Perfil da pessoa para a experiência do paciente.
 *
 * Lê apenas dois fatos: os pesos do cruzamento deste Case (a RLS decide o que
 * este paciente alcança) e o estado de validação do Perfil de Prioridades. A
 * projeção em linguagem de pessoa é do módulo puro — aqui é só banco.
 */
export async function loadPatientPerfil(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PerfilView> {
  const [{ data: weightRows }, { data: profile }] = await Promise.all([
    supabase.from("cruzamento_weights").select("criterion, weight").eq("case_id", caseId),
    supabase.from("priority_profiles").select("status").eq("case_id", caseId).maybeSingle(),
  ]);

  const weights = Object.fromEntries(
    (weightRows ?? []).map((row) => [row.criterion as CruzamentoCriterion, row.weight as number]),
  ) as Partial<Record<CruzamentoCriterion, number>>;

  return buildPerfilView(weights, profile?.status === "VALIDATED");
}
