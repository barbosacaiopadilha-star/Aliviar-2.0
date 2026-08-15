import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * OPS-G5 · CORTE 7 (remediação) — publicar é uma transição, não uma escrita.
 *
 * As fixtures publicavam gravando `publication_status` direto. Era essa a
 * segunda régua: cada publicação por ali criava uma linha em que o ciclo dizia
 * uma coisa e a vitrine dizia outra. O banco agora recusa esse caminho, e as
 * fixtures passam pela mesma porta que o produto usa — que é o que as torna
 * fixtures, e não encenação.
 *
 * O autor é obrigatório no banco. Quando o chamador não tem um à mão, qualquer
 * perfil serve: o que a guarda cobra é que o ato **tenha** autor, não que seja
 * um autor específico. ⛔ Nenhuma guarda é afrouxada aqui.
 */

async function algumPerfil(client: SupabaseClient): Promise<string> {
  const { data } = await client.from("profiles").select("id").limit(1);
  const id = data?.[0]?.id as string | undefined;
  if (!id) throw new Error("Nenhum profile no banco. Rode `npm run bootstrap:test-users:local`.");
  return id;
}

/**
 * O `update` que publica. Use como `.update(await transicaoPublicar(client))`.
 *
 * `updated_by` vai junto porque a RLS da tabela exige `updated_by = auth.uid()`
 * em todo UPDATE — regra anterior ao Corte 7, que o writer de produção sempre
 * cumpriu. Sob sessão autenticada, o valor precisa ser o uid da própria sessão;
 * sob `service_role` (que ignora RLS), qualquer autor válido serve.
 */
export async function transicaoPublicar(client: SupabaseClient, autorId?: string) {
  const autor = autorId ?? (await algumPerfil(client));
  return {
    ciclo_de_vida: "PUBLICADO_ATIVO",
    ciclo_motivo: "CADASTRO_VALIDADO",
    ciclo_alterado_por: autor,
    updated_by: autor,
  };
}

/**
 * O `update` que despublica. Leva a `PAUSADO`, não a `PREPARACAO`: quem já
 * esteve na Rede e saiu está pausado, e voltar à preparação apagaria a
 * diferença entre quem nunca entrou e quem saiu.
 */
export async function transicaoDespublicar(client: SupabaseClient, autorId?: string) {
  const autor = autorId ?? (await algumPerfil(client));
  return {
    ciclo_de_vida: "PAUSADO",
    ciclo_motivo: "REVISAO_CADASTRAL",
    ciclo_alterado_por: autor,
    updated_by: autor,
  };
}
