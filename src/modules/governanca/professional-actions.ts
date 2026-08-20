"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import { registrarAceitesDoProfissional } from "./professional-repository";

/**
 * O REGISTRO DO ACEITE DO PROFISSIONAL — ato da Curadoria, na homologação.
 *
 * A action existe porque, na 1.0, o profissional não tem portal: ele
 * manifesta concordância fora do sistema (reunião de homologação, assinatura,
 * e-mail) e a equipe registra. O que este caminho NUNCA faz é fingir que
 * houve aceite eletrônico do titular — a `natureza` gravada diz a verdade, e
 * a forma de obtenção é obrigatória no banco.
 */

export type ProfessionalGovernancaResult = { success: true } | { success: false; error: string };

const registroSchema = z.object({
  professionalProfileId: z.string().uuid(),
  versionIds: z.array(z.string().uuid()).min(1),
  // O que torna o registro auditável: como o aceite foi obtido, nas palavras
  // de quem o obteve. Mínimo generoso de propósito — "ok" não é registro.
  formaDeObtencao: z.string().min(10).max(500),
  evidenciaRef: z.string().max(500).optional(),
  // A data do ato pode ser anterior ao registro; o banco recusa futuro.
  aceitoEm: z.string().datetime().optional(),
});

export async function registrarAceitesDoProfissionalAction(
  input: unknown,
): Promise<ProfessionalGovernancaResult> {
  try {
    await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registroSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.path[0] === "formaDeObtencao"
          ? "Descreva como o aceite foi obtido — um registro sem isso não comprova nada."
          : "Dados inválidos.",
    };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await registrarAceitesDoProfissional(supabase, {
      professionalProfileId: parsed.data.professionalProfileId,
      versionIds: parsed.data.versionIds,
      formaDeObtencao: parsed.data.formaDeObtencao,
      evidenciaRef: parsed.data.evidenciaRef ?? null,
      aceitoEm: parsed.data.aceitoEm ?? null,
    });
  } catch (erro) {
    return { success: false, error: (erro as Error).message };
  }

  revalidatePath(`/admin/profissionais/${parsed.data.professionalProfileId}`, "layout");
  return { success: true };
}
