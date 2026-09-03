import type { SupabaseClient } from "@supabase/supabase-js";

import type { TipoDePedido } from "./repository";

/**
 * A FILA DE PEDIDOS DO TITULAR, do lado da operação.
 *
 * Leitura pelo cliente autenticado normal, com RLS — a policy
 * `data_subject_requests_proprio` já diz `or curadoria.has_role('administrador')`,
 * e a irmã dela faz o mesmo nos itens. **Não há service role aqui:** dado de
 * negócio se lê pelo cliente do usuário, e a RLS é a fronteira (o cabeçalho de
 * `lib/supabase/admin.ts` é explícito). O service role aparece só nas ações,
 * onde a escrita exige.
 *
 * O NOME DA PESSOA vem de `profiles`, cuja policy responde ao administrador
 * (`profiles_select_own_or_admin`). Sem o nome, a fila seria uma lista de
 * uuids — e quem atende um pedido de eliminação precisa saber de quem é, para
 * conferir a confirmação nominal antes de executar.
 */

export type StatusDePedido = "recebido" | "em_execucao" | "concluido" | "recusado";
export type EstadoDoItem = "pendente" | "removido" | "retido_por_obrigacao_legal" | "falhou";

export type ItemDoPedido = {
  id: string;
  recurso: string;
  estado: EstadoDoItem;
  verificadoEm: string | null;
  detalhe: string | null;
};

export type PedidoParaOperacao = {
  id: string;
  profileId: string;
  /** `null` quando o perfil já não existe — pedido de quem foi eliminado. */
  nomeDoTitular: string | null;
  tipo: TipoDePedido;
  status: StatusDePedido;
  criadoEm: string;
  prazoEm: string | null;
  concluidoEm: string | null;
  desfecho: string | null;
  itens: ItemDoPedido[];
};

export async function listarPedidosParaOperacao(
  supabase: SupabaseClient,
): Promise<PedidoParaOperacao[]> {
  const { data, error } = await supabase
    .from("data_subject_requests")
    .select("id, profile_id, tipo, status, prazo_em, criado_em, concluido_em, desfecho")
    .order("criado_em", { ascending: true });
  if (error) throw new Error(`Pedidos do titular: ${error.message}`);
  const pedidos = data ?? [];
  if (pedidos.length === 0) return [];

  const profileIds = [...new Set(pedidos.map((p) => p.profile_id as string))];
  const [{ data: perfis }, { data: itens }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", profileIds),
    supabase
      .from("data_subject_request_items")
      .select("id, request_id, recurso, estado, verificado_em, detalhe")
      .in(
        "request_id",
        pedidos.map((p) => p.id as string),
      ),
  ]);

  const nomePorId = new Map((perfis ?? []).map((p) => [p.id as string, p.display_name as string | null]));
  const itensPorPedido = new Map<string, ItemDoPedido[]>();
  for (const i of itens ?? []) {
    const lista = itensPorPedido.get(i.request_id as string) ?? [];
    lista.push({
      id: i.id as string,
      recurso: i.recurso as string,
      estado: i.estado as EstadoDoItem,
      verificadoEm: (i.verificado_em as string | null) ?? null,
      detalhe: (i.detalhe as string | null) ?? null,
    });
    itensPorPedido.set(i.request_id as string, lista);
  }

  return pedidos.map((p) => ({
    id: p.id as string,
    profileId: p.profile_id as string,
    nomeDoTitular: nomePorId.get(p.profile_id as string) ?? null,
    tipo: p.tipo as TipoDePedido,
    status: p.status as StatusDePedido,
    criadoEm: p.criado_em as string,
    prazoEm: (p.prazo_em as string | null) ?? null,
    concluidoEm: (p.concluido_em as string | null) ?? null,
    desfecho: (p.desfecho as string | null) ?? null,
    itens: itensPorPedido.get(p.id as string) ?? [],
  }));
}

/**
 * As eliminações já executadas — lidas de `audit_logs`, e não da fila.
 *
 * **Por que a fila não serve para isto.** `data_subject_requests.profile_id`
 * referencia `profiles` com `ON DELETE CASCADE`, e `profiles` cascateia de
 * `auth.users`: quando a eliminação acontece, **o pedido desaparece junto com
 * a pessoa**. Não é defeito de implementação — é o que "eliminar" significa.
 * A prova sobrevive porque `audit_logs` guarda o id no `metadata`, e a coluna
 * com FK vira nula (migration `20260903040000`, §2 e §4).
 *
 * Então a tela lê o histórico de eliminações aqui, e nunca da fila. Uma tela
 * que fosse buscar "pedidos concluídos do tipo exclusão" mostraria uma lista
 * eternamente vazia e pareceria correta.
 */
export type EliminacaoExecutada = {
  id: number;
  profileIdEliminado: string | null;
  motivo: string | null;
  casesDescartados: number | null;
  documentos: number | null;
  orfaosDeStorage: number | null;
  executadoEm: string;
};

export async function listarEliminacoesExecutadas(
  supabase: SupabaseClient,
  limite = 20,
): Promise<EliminacaoExecutada[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, metadata, created_at")
    .eq("action", "data_subject_request_closed")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Eliminações executadas: ${error.message}`);

  return (data ?? []).map((linha) => {
    const m = (linha.metadata ?? {}) as Record<string, unknown>;
    const numero = (v: unknown) => (typeof v === "number" ? v : null);
    return {
      id: linha.id as number,
      profileIdEliminado: typeof m.profile_id === "string" ? m.profile_id : null,
      motivo: typeof m.reason === "string" ? m.reason : null,
      casesDescartados: numero(m.cases_discarded),
      documentos: numero(m.documents),
      orfaosDeStorage: numero(m.storage_orphans),
      executadoEm: linha.created_at as string,
    };
  });
}

/** Quantos pedidos ainda esperam alguém. É o número que a Visão geral mostra. */
export async function contarPedidosEmAberto(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("data_subject_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["recebido", "em_execucao"]);
  if (error) throw new Error(`Pedidos em aberto: ${error.message}`);
  return count ?? 0;
}
