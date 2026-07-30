import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A POLÍTICA DA REDE — quem a Curadoria pode oferecer, num lugar só.
 *
 * @metodo Modelo v1.0 §9 — proveniência: divergência aberta aparece, nunca some
 * @metodo Fundamentos §13 — P6: o universo é fechado e previamente aprovado
 *
 * Por que existe: a exclusão por divergência crítica vivia dentro de
 * `listApprovedProviders`, e a Mesa montava a própria consulta de Rede sem
 * ela. O resultado observado na certificação dinâmica (NC-22) foi um
 * profissional publicado com divergência crítica em aberto aparecendo para
 * classificação na Mesa e sumindo da Rede aprovada — dois universos para a
 * mesma pergunta.
 *
 * A regra passa a existir uma vez. Quem monta Rede pergunta aqui.
 */

/**
 * Profissionais bloqueados por divergência crítica em aberto.
 *
 * Duas fontes discordam sobre um dado que importa, e enquanto ninguém
 * resolver não há o que oferecer. O perfil pode ter sido publicado antes de a
 * divergência aparecer; sai da Rede na hora, sem esperar decisão de
 * despublicar — e volta sozinho quando a divergência for resolvida.
 *
 * Bloqueia, nunca apaga: o cadastro continua lá, e o que falta é verificação.
 */
export async function listCriticalDivergenceBlocklist(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("verification_divergences")
    .select("professional_profile_id")
    .eq("status", "aberta")
    .eq("severity", "critica");

  return new Set((data ?? []).map((row) => row.professional_profile_id as string));
}
