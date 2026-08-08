"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * ADAPTADORES FINOS do juízo humano (Item 2.3 §13) — validação de forma,
 * chamada da capability, tradução do desfecho. ZERO regra de domínio: quem
 * decide é o banco (gate-first, RS-2.3-1, árbitros de concorrência do 2.4).
 *
 * Nenhuma action aceita autor: a identidade É a sessão (`auth.uid()` dentro
 * da capability). `actor_id` não existe em payload nenhum — G-2.3-3.
 */

export type DesfechoDoJulgamento = {
  desfecho:
    | "JUIZO_REGISTRADO"
    | "VERSAO_JA_GRAVADA"
    | "CONFLITO_DE_VERSAO"
    | "SEM_AUTORIDADE"
    | "JUIZO_RETIRADO"
    | "ERRO_TECNICO";
  versaoId: string | null;
  /** Mensagem técnica sanitizada quando ERRO_TECNICO — nunca conteúdo clínico. */
  detalhe?: string;
};

function traduzir(data: unknown, error: { message: string } | null): DesfechoDoJulgamento {
  if (error) {
    return { desfecho: "ERRO_TECNICO", versaoId: null, detalhe: error.message };
  }
  const linha = (Array.isArray(data) ? data[0] : data) as
    | { desfecho?: string; versao_id?: string | null }
    | undefined;
  if (!linha?.desfecho) {
    return { desfecho: "ERRO_TECNICO", versaoId: null, detalhe: "resposta vazia da capability" };
  }
  return {
    desfecho: linha.desfecho as DesfechoDoJulgamento["desfecho"],
    versaoId: linha.versao_id ?? null,
  };
}

export async function registrarJulgamentoAction(input: {
  caseId: string;
  professionalProfileId: string;
  subcriterionCode: string;
  natureza: "TECNICO" | "RELACIONAL";
  conclusao: string;
  fatosVisiveis: { registro: string; versao: string }[];
  evidencias: { id: string; version: number }[];
  motivo?: string | null;
  versaoBaseId?: string | null;
}): Promise<DesfechoDoJulgamento> {
  const conclusao = input.conclusao?.trim() ?? "";
  if (conclusao.length === 0) {
    // Forma, não domínio: "ainda não sei" não produz julgamento (ADR-067 §7).
    return { desfecho: "ERRO_TECNICO", versaoId: null, detalhe: "conclusão vazia não é juízo" };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("registrar_julgamento", {
    p_case_id: input.caseId,
    p_professional_profile_id: input.professionalProfileId,
    p_subcriterion_code: input.subcriterionCode,
    p_natureza: input.natureza,
    p_conclusao: conclusao,
    p_fatos_visiveis: input.fatosVisiveis ?? [],
    p_evidencias: input.evidencias ?? [],
    p_motivo: input.motivo?.trim() || null,
    p_versao_base_id: input.versaoBaseId ?? null,
  });
  return traduzir(data, error);
}

export async function retirarJulgamentoAction(input: {
  versaoVigenteId: string;
  motivo?: string | null;
}): Promise<DesfechoDoJulgamento> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("retirar_julgamento", {
    p_versao_vigente_id: input.versaoVigenteId,
    p_motivo: input.motivo?.trim() || null,
  });
  return traduzir(data, error);
}
