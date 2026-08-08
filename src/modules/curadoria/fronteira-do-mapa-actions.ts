"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * OS DOIS ATOS DA FRONTEIRA (Item 2.C §5 el. 5) — adaptadores finos da
 * capability ÚNICA `decidir_proposta` (1.12, estendida pelo 2.C).
 *
 * Item a item POR CONSTRUÇÃO (DP-5, G-2.C-3/7): cada action recebe UM
 * `proposalId` — não existe array, seleção múltipla, laço, nem "confirmar
 * todos". Autoria é a sessão (`auth.uid()` dentro da capability): nenhum
 * parâmetro de ator existe (G-2.C-5). O motivo é OFERECIDO nos dois atos e
 * exigido em nenhum (P-10/O2 de custo).
 */

export type DesfechoDaFronteira = {
  desfecho:
    | "ATO_REGISTRADO"
    | "ATO_JA_REGISTRADO"
    | "ATO_JA_CONSUMADO"
    | "PROPOSTA_NAO_DECIDIVEL"
    | "PROPOSTA_INEXISTENTE"
    | "SEM_AUTORIDADE"
    | "NATUREZA_INVALIDA"
    | "MOTIVO_INVALIDO"
    | "ERRO_TECNICO";
  detalhe?: string;
};

async function decidir(
  proposalId: string,
  natureza: "CONFIRMACAO" | "RECUSA",
  motivo?: string | null,
): Promise<DesfechoDaFronteira> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("decidir_proposta", {
    p_proposal_id: proposalId,
    p_natureza: natureza,
    p_motivo: motivo?.trim() || null,
  });
  if (error) return { desfecho: "ERRO_TECNICO", detalhe: error.message };
  return { desfecho: data as DesfechoDaFronteira["desfecho"] };
}

export async function confirmarItemDaFronteiraAction(input: {
  proposalId: string;
  motivo?: string | null;
}): Promise<DesfechoDaFronteira> {
  return decidir(input.proposalId, "CONFIRMACAO", input.motivo);
}

export async function recusarItemDaFronteiraAction(input: {
  proposalId: string;
  motivo?: string | null;
}): Promise<DesfechoDaFronteira> {
  return decidir(input.proposalId, "RECUSA", input.motivo);
}
