"use server";

import { revalidatePath } from "next/cache";
import { falhaParaUsuario } from "@/lib/observability/erros";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { isSubcriterionStatus, NOTE_MAX_LENGTH } from "./mapa-profissional";
import { saveProfessionalMapEntries } from "./mapa-profissional-repository";

/**
 * Gravação do Mapa do Profissional.
 *
 * Mesmo recorte de quem edita profissional: `administrador`. Não é o
 * profissional que declara sobre si — é a operação que registra o que
 * verificou.
 *
 * A mensagem de erro nunca é "Dados inválidos": ela diz o item, a regra e o
 * que fazer. Quem preenche 26 subcritérios precisa saber qual deles travou.
 */
export async function saveProfessionalSubcriterionAction(input: {
  professionalProfileId: string;
  subcriterionCode: string;
  status: string;
  note?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requireRoleForAction("administrador");
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("curadoria.mapa-profissional-actions", erro, { mensagem: "Só quem edita profissionais pode registrar o Mapa." }) };
  }

  if (!input.professionalProfileId || !input.subcriterionCode) {
    return { success: false, error: "Faltou identificar o profissional ou o subcritério." };
  }

  if (!isSubcriterionStatus(input.status)) {
    return {
      success: false,
      error: `"${input.status}" não é um estado do Método. Escolha entre Confirmado, Não confirmado e Não informado.`,
    };
  }

  const nota = (input.note ?? "").trim();
  if (nota.length > NOTE_MAX_LENGTH) {
    return {
      success: false,
      error: `A observação tem ${nota.length} caracteres e o limite é ${NOTE_MAX_LENGTH}. Ela é apoio à leitura, não laudo.`,
    };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await saveProfessionalMapEntries(supabase, input.professionalProfileId, [
      {
        subcriterionCode: input.subcriterionCode,
        status: input.status,
        note: input.note ?? null,
      },
    ]);
  } catch (erro) {
    // A mensagem do domínio já é escrita para ser lida por gente.
    return { success: false, error: erro instanceof Error ? erro.message : "Não foi possível gravar." };
  }

  revalidatePath(`/admin/profissionais/${input.professionalProfileId}`);
  return { success: true };
}
