import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  montarPainelDeDiscordancia,
  type ContagemAgregada,
  type PainelDeDiscordancia,
} from "./painel-de-discordancia";

/**
 * O ÚNICO chamador da capability agregada (CONTRATO_1_11 §10/§12).
 *
 *   contar_propostas_por_desfecho()   (banco — única agregação)
 *           ↓
 *   este repositório                  (não conhece a tabela; não agrega em
 *           ↓                          memória; não lê proposta individual)
 *   modelo puro do Painel             (taxa §5; vazio honesto §8)
 *
 * O que este módulo NUNCA faz: chamar `ler_proposta_para_proveniencia` — a
 * capability individual tem outro chamador nominal, e agregar por chamadas
 * repetidas a ela reintroduziria o acesso individual que o §10.1 proíbe. A
 * agregação nasce no banco, e só nele.
 *
 * Leitura apenas. Sem writer, sem persistência, sem cache: a leitura é
 * recalculada sempre (D-03).
 */
export async function loadPainelDeDiscordancia(
  supabase: SupabaseClient,
): Promise<PainelDeDiscordancia> {
  const { data, error } = await supabase.rpc("contar_propostas_por_desfecho");

  if (error) throw new Error(`Painel de Discordância: ${error.message}`);

  const linhas = (data ?? []) as Record<string, unknown>[];
  const contagens: ContagemAgregada[] = linhas.map((linha) => ({
    subcriterionCode: linha.subcriterion_code as string,
    ruleId: linha.rule_id as string,
    ruleVersion: linha.rule_version as number,
    state: linha.state as ContagemAgregada["state"],
    contagem: Number(linha.contagem),
  }));

  return montarPainelDeDiscordancia(contagens);
}
