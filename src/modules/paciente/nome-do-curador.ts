import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ITEM 2.6 / G-10 — o nome do Curador chega pela capability nominal.
 *
 * A RLS de `curadoria.profiles` continua fechada para a paciente — e isso está
 * certo como regra geral. A única pergunta autorizada é "qual é o nome do
 * Curador do MEU Case?", e quem a responde é a capability
 * `curadoria.nome_do_curador_do_caso` (CONTRATO_2_6 §11, Opção B, PA-14):
 * gate-first com `is_patient_for_case`, catálogo fechado de três desfechos,
 * saída mínima (`display_name` somente).
 *
 * Este wrapper devolve o nome quando o desfecho é `OK`, e `null` para todo o
 * resto — `SEM_AUTORIDADE`, `CURADOR_NAO_ATRIBUIDO`, erro de transporte. A
 * superfície degrada para o fallback genérico que sempre teve ("Curador"),
 * nunca para uma mensagem que revele por que o nome não veio: distinguir os
 * desfechos aqui recriaria no cliente o vazamento que o catálogo fundiu no
 * banco (§15 — não-vazamento por desenho).
 *
 * SOMENTE o caminho da paciente usa este módulo. Superfícies internas (Mesa,
 * admin) seguem lendo `profiles` normalmente — as guardas do 2.6 varrem isso.
 */
export async function nomeDoCuradorDoCaso(
  supabase: SupabaseClient,
  caseId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("nome_do_curador_do_caso", { p_case_id: caseId });
  if (error || !data) return null;

  const linha = (Array.isArray(data) ? data[0] : data) as
    | { desfecho?: string; display_name?: string | null }
    | undefined;

  return linha?.desfecho === "OK" ? (linha.display_name ?? null) : null;
}
