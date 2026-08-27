import type { Metadata } from "next";
import Link from "next/link";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { Dobra } from "@/components/paciente/experiencia/dobra";
import { ListaDeAceites } from "@/components/governanca/lista-de-aceites";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { CentralDeDocumentos } from "@/components/paciente/documentos/central-de-documentos";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { carregarCentralDeDocumentos } from "@/modules/paciente/central-de-documentos-loader";
import { carregarEstadoDeGovernanca, listarPedidosDoTitular } from "@/modules/governanca/repository";

export const metadata: Metadata = {
  title: "Seus documentos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A6 · A CENTRAL DE DOCUMENTOS — agora com os consentimentos DENTRO dela.
 *
 * MERGE DE 23/08 (decisão do Fundador: "às vezes tem muita página"):
 * `/paciente/documentos-e-consentimentos` era uma página própria sem caminho
 * no menu. O conteúdo — histórico de aceites, pendências e pedidos do
 * titular — mudou de endereço, nunca de natureza: continua completo, com o
 * texto exato de cada versão aceita, e nada é apagado. A rota antiga
 * redireciona para cá.
 *
 * Por isso esta rota entrou em `ROTAS_LIVRES_DO_GATE`: a superfície de
 * consentimento não pode ficar atrás do gate de aceite — bloquear o
 * exercício de direitos por falta de aceite seria coagir consentimento, e o
 * mesmo vale para o acesso dela ao que é dela.
 */
export default async function PatientDocumentsPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const itens = await carregarCentralDeDocumentos(supabase, authState.user.id);
  const { documentos, versoesPorDocumento, aceites, pendencias } =
    await carregarEstadoDeGovernanca(supabase, authState.user.id, authState.roles);
  const pedidos = await listarPedidosDoTitular(supabase, authState.user.id);

  return (
    <div className="space-y-12">
      <PatientPageHeader
        title="Seus documentos"
        description="Tudo o que você enviou, recebeu e aceitou da Aliviar, em um só lugar."
      />

      {/*
        UMA folha, não uma caixa por item. O PatientShell tem arquitetura ao
        fundo, e ela não pode competir com a leitura de uma lista de exames
        (§15). Uma superfície só resolve isso sem virar grade de arquivos: o
        que o assistido vê é um dossiê, não um gerenciador.
      */}
      <PatientCard className="lg:p-12">
        <CentralDeDocumentos itens={itens} />
      </PatientCard>

      {/* SEUS CONSENTIMENTOS — a dobra abre sozinha quando algo aguarda a
          pessoa: pendência escondida atrás de um toque seria silêncio sobre
          o que depende dela. */}
      <Dobra
        titulo="Seus consentimentos"
        rotulo="Seus consentimentos"
        abertaInicial={pendencias.length > 0}
      >
        <div className="space-y-8">
          <p className="max-w-prose text-sm leading-relaxed text-ink-muted">
            Tudo o que você aceitou, quando aceitou, e o texto exato que estava valendo naquele
            momento. Nada aqui é apagado: mesmo o que você revogou continua registrado, porque é a
            prova de que a escolha foi sua.
          </p>

          {pendencias.length > 0 ? (
            <section className="rounded-md border border-border bg-surface-muted p-4">
              <h3 className="font-medium text-ink">Aguardando você</h3>
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
            <h3 className="font-serif text-lg font-medium text-ink">Seu histórico</h3>
            <div className="mt-4">
              <ListaDeAceites
                aceites={aceites}
                documentos={documentos}
                versoes={versoesPorDocumento}
              />
            </div>
          </section>

          <section>
            <h3 className="font-serif text-lg font-medium text-ink">Seus pedidos</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Acesso, correção, exclusão, portabilidade e revogação. Cada pedido fica registrado
              com data e desfecho.
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
                      {new Date(pedido.criadoEm).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
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
      </Dobra>

      {/* C5/C7 · Track C — "como eu mando isso para vocês?" e "o que eu
          aceitei?" desembocam na mesma porta. O tópico segue `documento`. */}
      <ConciergeLink topic="documento" />
    </div>
  );
}
