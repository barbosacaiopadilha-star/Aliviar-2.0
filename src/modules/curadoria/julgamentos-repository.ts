import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { JulgamentoLido } from "./julgamentos";

/**
 * A LEITURA do juízo humano para a Mesa (Item 2.3 §12/§13).
 *
 * `curator_judgments` não tem policy nem grant — o cliente jamais toca a
 * tabela. TODO acesso de leitura passa pela capability
 * `ler_julgamentos_para_avaliacao` (SECURITY DEFINER, gate-first
 * `is_curator_for_case`): sem autoridade, zero linhas — e é assim que deve
 * ser. Este repository só traduz a resposta para o modelo do domínio puro.
 */
export async function loadJulgamentosDaAvaliacao(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileId: string,
): Promise<JulgamentoLido[]> {
  const { data, error } = await supabase.rpc("ler_julgamentos_para_avaliacao", {
    p_case_id: caseId,
    p_professional_profile_id: professionalProfileId,
  });
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((linha) => ({
    id: linha.id as string,
    subcriterionCode: linha.subcriterion_code as string,
    natureza: linha.natureza as JulgamentoLido["natureza"],
    state: linha.state as JulgamentoLido["state"],
    conclusao: linha.conclusao as string,
    motivo: (linha.motivo as string | null) ?? null,
    versao: linha.versao as number,
    versaoAnteriorId: (linha.versao_anterior_id as string | null) ?? null,
    actorId: linha.actor_id as string,
    actedAt: linha.acted_at as string,
    temSucessora: Boolean(linha.tem_sucessora),
    evidencias: ((linha.evidencias as Record<string, unknown>[]) ?? []).map((referencia) => ({
      evidenceId: referencia.evidenceId as string,
      evidenceVersion: referencia.evidenceVersion as number,
      verificationStatus: referencia.verificationStatus as string,
    })),
  }));
}
