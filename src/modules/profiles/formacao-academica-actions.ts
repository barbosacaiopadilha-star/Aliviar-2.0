"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import { processarCurriculo, type ResultadoDaExtracao } from "@/modules/profiles/formacao-academica-extracao";
import {
  confirmarFormacao,
  criarFormacaoManual,
  excluirFormacao,
  registrarConceitoDoMec,
  salvarEdicaoDeFormacao,
  type CamposDeFormacao,
} from "@/modules/profiles/formacao-academica-repository";

type Resultado<T = null> = { success: true; data: T } | { success: false; error: string };

/**
 * As portas da Formação Acadêmica. Todas exigem administrador; a autoria da
 * confirmação vem da SESSÃO (`auth.uid()` via state), nunca do payload — a
 * mesma lição do Corte 7. E nenhuma action confirma em lote: a decisão
 * vinculante 5 pede revisão individual, então a porta só aceita UMA entrada.
 */

const MENSAGENS: Record<string, string> = {
  tipo_invalido: "Tipo de formação fora da lista reconhecida.",
  titulo_obrigatorio: "A formação precisa de um título.",
  instituicao_obrigatoria:
    "Instituição é obrigatória para publicar. Preencha-a ou registre a justificativa de ausência.",
  entrada_inexistente: "Esta formação não existe mais.",
  fonte_ausente:
    "Esta formação não tem fonte registrada. Releia o currículo ou registre-a manualmente antes de confirmar.",
  escrita_recusada: "O banco recusou a escrita.",
  conceito_fora_da_escala: "O conceito do MEC vai de 1 a 5.",
  ano_implausivel: "O ano do conceito não parece um ano de ciclo avaliativo.",
  conceito_so_na_graduacao:
    "Conceito do MEC existe para curso de graduação. Residência é credenciada pela CNRM, e os demais tipos não têm conceito.",
};

function mensagem(motivo: string): string {
  return MENSAGENS[motivo] ?? "Não foi possível concluir.";
}

export async function lerCurriculoAction(
  professionalProfileId: string,
  documentId: string,
): Promise<Resultado<ResultadoDaExtracao>> {
  const state = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const resultado = await processarCurriculo({
    supabase,
    professionalProfileId,
    documentId,
    actorId: state.user.id,
  });
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: resultado };
}

export async function salvarFormacaoAction(
  professionalProfileId: string,
  entryId: string,
  campos: CamposDeFormacao,
): Promise<Resultado> {
  await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const r = await salvarEdicaoDeFormacao(supabase, entryId, campos);
  if (!r.ok) return { success: false, error: mensagem(r.motivo) };
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: null };
}

export async function confirmarFormacaoAction(
  professionalProfileId: string,
  entryId: string,
  justificativaSemInstituicao?: string,
): Promise<Resultado> {
  const state = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const r = await confirmarFormacao(supabase, entryId, state.user.id, {
    justificativaSemInstituicao,
  });
  if (!r.ok) return { success: false, error: mensagem(r.motivo) };
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: null };
}

/**
 * Lança (ou apaga) o conceito do MEC. Porta própria porque a escrita é própria:
 * não rebaixa a verificação da entrada — ver `registrarConceitoDoMec`.
 */
export async function registrarConceitoDoMecAction(
  professionalProfileId: string,
  entryId: string,
  conceito: number | null,
  ano: number | null,
): Promise<Resultado> {
  await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const r = await registrarConceitoDoMec(supabase, entryId, conceito, ano);
  if (!r.ok) return { success: false, error: mensagem(r.motivo) };
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: null };
}

export async function excluirFormacaoAction(
  professionalProfileId: string,
  entryId: string,
): Promise<Resultado> {
  await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const r = await excluirFormacao(supabase, entryId);
  if (!r.ok) return { success: false, error: mensagem(r.motivo) };
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: null };
}

export async function criarFormacaoManualAction(
  professionalProfileId: string,
  campos: CamposDeFormacao,
): Promise<Resultado> {
  await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  const r = await criarFormacaoManual(supabase, professionalProfileId, campos);
  if (!r.ok) return { success: false, error: mensagem(r.motivo) };
  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true, data: null };
}
