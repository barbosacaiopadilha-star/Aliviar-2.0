import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { ordenarPorPressao } from "@/modules/governanca/pedidos-prazo";
import {
  listarEliminacoesExecutadas,
  listarPedidosParaOperacao,
} from "@/modules/governanca/pedidos-repository";

import { PedidosDoTitular } from "@/components/admin/pedidos-do-titular";

export const metadata: Metadata = {
  title: "Pedidos do titular",
  robots: { index: false, follow: false },
};

// A fila muda por ato humano e tem prazo: nada aqui pode vir de cache.
export const dynamic = "force-dynamic";

/**
 * PEDIDOS DO TITULAR — a tela que executa os direitos da LGPD.
 *
 * Nasce fechando o buraco que o `SIM-99` deixou nomeado: a porta do banco
 * (`eliminar_titular`) passou a existir em 03/09, **e ninguém a chamava**. O
 * pedido era gravado por `abrirPedidoDeTitular`, aparecia na área da pessoa
 * como "recebido", e ficava lá para sempre.
 *
 * A LEITURA É PELO CLIENTE NORMAL, com RLS. As duas policies de governança já
 * dizem `or curadoria.has_role('administrador')` — não há service role nesta
 * página. Ele aparece só nas ações, porque `authenticated` tem `select, insert`
 * e nada mais na tabela: *"abrir pedido é ato do titular; executá-lo é da
 * operação"*.
 *
 * A ordem da fila é por PRESSÃO DE PRAZO, não por data de abertura: quem está
 * mais perto do limite vem primeiro, e o mais antigo desempata. Uma fila
 * cronológica pareceria justa e deixaria vencer o que vence antes.
 */
export default async function PedidosDoTitularPage() {
  await requireRole("administrador");
  const supabase = await createServerSupabaseClient();

  const [pedidos, eliminacoes] = await Promise.all([
    listarPedidosParaOperacao(supabase),
    listarEliminacoesExecutadas(supabase),
  ]);

  const emAberto = ordenarPorPressao(
    pedidos.filter((p) => p.status === "recebido" || p.status === "em_execucao"),
  );
  const respondidos = pedidos
    .filter((p) => p.status === "concluido" || p.status === "recusado")
    .sort((a, b) => (b.concluidoEm ?? b.criadoEm).localeCompare(a.concluidoEm ?? a.criadoEm));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Pedidos do titular</h1>
        <p className="max-w-reading text-sm text-ink-muted">
          Acesso, correção, eliminação, portabilidade e revogação de consentimento. Cada pedido tem
          prazo de resposta, e responder é obrigação — inclusive quando a resposta é uma recusa
          fundamentada.
        </p>
      </div>

      <PedidosDoTitular emAberto={emAberto} respondidos={respondidos} eliminacoes={eliminacoes} />
    </div>
  );
}
