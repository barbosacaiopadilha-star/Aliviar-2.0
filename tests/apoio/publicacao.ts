import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * OPS-G5 · CORTE 7 (remediação) — publicar é uma transição, não uma escrita.
 *
 * Desde a migration 20260815021141, `service_role` transita SOMENTE declarando
 * o ator técnico na mesma transação — e o PostgREST fecha a transação a cada
 * chamada, então o caminho é a RPC `transicionar_ciclo_como_servico`, que faz
 * `set_config` e UPDATE juntos. Sessão autenticada não passa por aqui: a
 * autoria dela é `auth.uid()`, forçada pelo trigger.
 *
 * ⛔ Nenhuma guarda é afrouxada: a RPC só junta duas instruções; quem valida é
 * o trigger, como sempre.
 */

async function algumPerfil(client: SupabaseClient): Promise<string> {
  const { data } = await client.from("profiles").select("id").limit(1);
  const id = data?.[0]?.id as string | undefined;
  if (!id) throw new Error("Nenhum profile no banco. Rode `npm run bootstrap:test-users:local`.");
  return id;
}

type Resultado = { error: { message: string } | null };

async function transicionar(
  client: SupabaseClient,
  profissionalId: string,
  para: "PUBLICADO_ATIVO" | "PAUSADO",
  motivo: string,
  autorId?: string,
): Promise<Resultado> {
  const ator = autorId ?? (await algumPerfil(client));
  const { error } = await client.schema("curadoria").rpc("transicionar_ciclo_como_servico", {
    p_profissional: profissionalId,
    p_para: para,
    p_motivo: motivo,
    p_ator: ator,
  });
  return { error };
}

/** Publica pela porta da frente do serviço. */
export async function publicarPeloCiclo(
  client: SupabaseClient,
  profissionalId: string,
  autorId?: string,
): Promise<Resultado> {
  return transicionar(client, profissionalId, "PUBLICADO_ATIVO", "CADASTRO_VALIDADO", autorId);
}

/**
 * Despublica: leva a `PAUSADO`, não a `PREPARACAO` — quem já esteve na Rede e
 * saiu está pausado, e voltar à preparação apagaria a diferença entre quem
 * nunca entrou e quem saiu.
 */
export async function despublicarPeloCiclo(
  client: SupabaseClient,
  profissionalId: string,
  autorId?: string,
): Promise<Resultado> {
  return transicionar(client, profissionalId, "PAUSADO", "REVISAO_CADASTRAL", autorId);
}
