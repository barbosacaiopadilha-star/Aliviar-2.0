"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import { revalidateCaseSurfaces } from "./revalidate";
import { transferCaseResponsibilityInputSchema } from "./schema";
import type { CaseActionResult } from "./types";

/**
 * Passagem de bastão do Case.
 *
 * @metodo Correção de Domínio §3 — o responsável muda, o Case não
 *
 * Não escreve em `responsible_id` diretamente. Chama a função
 * `curadoria.transfer_case_responsibility`, que é `SECURITY DEFINER`, tira o
 * ator de `auth.uid()` e grava a auditoria na mesma transação em que move o
 * Case. Duas consequências valem ser ditas:
 *
 * 1. O ator não pode ser falsificado. Nem esta action nem o cliente escolhem
 *    quem assinou a transferência — o banco lê da sessão.
 * 2. Se a auditoria falhar, o Case não se move. Não existe passagem de bastão
 *    sem rastro, nem por acidente.
 *
 * A validação abaixo é a mesma que o banco faz. Ela existe para a pessoa ver
 * "explique por que" em vez de um erro de Postgres — nunca como a garantia.
 * A garantia é o banco.
 */
export async function transferCaseResponsibilityAction(input: unknown): Promise<CaseActionResult> {
  try {
    await requireAnyRoleForAction(["administrador", "atendente", "curador_medico", "concierge"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = transferCaseResponsibilityInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { caseId, newResponsibleId, newRole, reason } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.schema("curadoria").rpc("transfer_case_responsibility", {
    _case_id: caseId,
    _new_responsible_id: newResponsibleId,
    _new_role: newRole,
    _reason: reason,
  });

  if (error) {
    // A mensagem do banco é escrita para ser lida por gente — as exceções da
    // função dizem o que falta, não o código do erro.
    return { success: false, error: error.message };
  }

  revalidateCaseSurfaces(caseId);
  return { success: true };
}
