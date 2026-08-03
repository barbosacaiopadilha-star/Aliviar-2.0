import type { Metadata } from "next";
import Link from "next/link";

import { ListaDeAceites } from "@/components/governanca/lista-de-aceites";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { carregarEstadoDeGovernanca, listarPedidosDoTitular } from "@/modules/governanca/repository";

export const metadata: Metadata = {
  title: "Documentos e Consentimentos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * DOCUMENTOS E CONSENTIMENTOS — a área da pessoa.
 *
 * Existe para que ela nunca precise pedir a ninguém para saber o que aceitou.
 * Mostra o histórico completo (inclusive o revogado e o superado), o texto
 * exato de cada versão aceita, e o que ainda está pendente.
 *
 * Esta rota é LIVRE do gate de aceite de propósito: bloquear aqui fecharia o
 * bloqueio sobre si mesmo — e bloquear o exercício de direitos por falta de
 * aceite seria coagir consentimento.
 */
export default async function DocumentosEConsentimentosPage() {
  const state = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const { documentos, versoesPorDocumento, aceites, pendencias } =
    await carregarEstadoDeGovernanca(supabase, state.user.id, state.roles);
  const pedidos = await listarPedidosDoTitular(supabase, state.user.id);

  return (
    <div className="mx-auto max-w-reading space-y-10 px-4 py-10">
      <header>
        <h1 className="font-serif text-2xl font-medium text-ink">Documentos e Consentimentos</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-muted">
          Tudo o que você aceitou, quando aceitou, e o texto exato que estava valendo naquele
          momento. Nada aqui é apagado: mesmo o que você revogou continua registrado, porque é a
          prova de que a escolha foi sua.
        </p>
      </header>

      {pendencias.length > 0 ? (
        <section className="rounded-md border border-border bg-surface-muted p-4">
          <h2 className="font-medium text-ink">Aguardando você</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {pendencias.map((p) => (
              <li key={p.documento.id}>
                {p.documento.nome} — versão {p.versao.versao}
                {p.motivo === "versao_nova" ? " (texto atualizado)" : ""}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link
              href="/aceites"
              className="font-medium text-brand-primary underline-offset-2 hover:underline"
            >
              Ler e decidir agora
            </Link>
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-xl font-medium text-ink">Seu histórico</h2>
        <div className="mt-4">
          <ListaDeAceites
            aceites={aceites}
            documentos={documentos}
            versoes={versoesPorDocumento}
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium text-ink">Seus pedidos</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Acesso, correção, exclusão, portabilidade e revogação. Cada pedido fica registrado com
          data e desfecho.
        </p>
        {pedidos.length === 0 ? (
          <p className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
            Você ainda não abriu nenhum pedido.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {pedidos.map((pedido) => (
              <li key={pedido.id} className="rounded-md border border-border px-4 py-3">
                <span className="font-medium text-ink">{pedido.tipo}</span>{" "}
                <span className="text-ink-muted">
                  · {pedido.status} · aberto em{" "}
                  {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
                </span>
                {pedido.desfecho ? (
                  <p className="mt-1 text-ink-muted">{pedido.desfecho}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
