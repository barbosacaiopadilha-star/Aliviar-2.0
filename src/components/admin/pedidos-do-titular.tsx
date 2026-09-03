"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  assumirPedidoAction,
  executarEliminacaoAction,
  registrarDesfechoAction,
} from "@/modules/governanca/pedidos-actions";
import { PRAZO_PROPOSTO_EM_DIAS, prazoDoPedido } from "@/modules/governanca/pedidos-prazo";
import type { EliminacaoExecutada, PedidoParaOperacao } from "@/modules/governanca/pedidos-repository";

/**
 * A FILA DE PEDIDOS DO TITULAR — a tela que executa.
 *
 * O `SIM-99` terminou com um buraco nomeado: *"a porta existe e ninguém a
 * chama"*. Esta é a superfície que chama.
 *
 * Três coisas nela são decisões, não acabamento:
 *
 * 1 · **O relógio aparece mesmo sem prazo fixado.** `prazo_em` é nulo porque a
 *     decisão é jurídica e não veio; a tela mostra a REFERÊNCIA de 15 dias e
 *     diz que é referência. Sem relógio nenhum, o prazo se perde; com um prazo
 *     inventado passando por prazo, a tela mente.
 *
 * 2 · **Eliminação e "registrar desfecho" são atos diferentes, e a tela não os
 *     confunde.** Só `exclusao` tem porta no banco. Acesso, correção,
 *     portabilidade e revogação são cumpridos por uma pessoa fora daqui — a
 *     tela registra a resposta, e não finge executar o que não executa.
 *
 * 3 · **A eliminação exige o nome digitado à mão**, como a exclusão de lead e
 *     a retirada de profissional. E o servidor confere contra o nome do banco,
 *     nunca contra o que o formulário mandou.
 */

const ROTULO_DO_TIPO: Record<PedidoParaOperacao["tipo"], string> = {
  acesso: "Acesso aos dados",
  correcao: "Correção de dado",
  exclusao: "Eliminação dos dados",
  portabilidade: "Portabilidade",
  revogacao: "Revogação de consentimento",
};

/** O que a operação faz, em cada caso, para quem abre a tela sem contexto. */
const COMO_SE_CUMPRE: Record<PedidoParaOperacao["tipo"], string> = {
  acesso: "Reúna o que a Aliviar tem sobre ela e envie. Depois registre aqui o que foi enviado.",
  correcao: "Corrija o cadastro pelo fluxo normal e registre aqui o que mudou.",
  exclusao: "A plataforma executa: apaga a pessoa, os Cases, as histórias e os arquivos, com auditoria.",
  portabilidade: "Gere a cópia em formato legível e envie. Depois registre aqui o que foi enviado.",
  revogacao: "Revogue o aceite na área dela e registre aqui qual consentimento caiu.",
};

const ROTULO_DO_STATUS: Record<PedidoParaOperacao["status"], string> = {
  recebido: "Recebido",
  em_execucao: "Em execução",
  concluido: "Concluído",
  recusado: "Recusado",
};

const data = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

type Alvo =
  | { modo: "eliminar"; pedido: PedidoParaOperacao }
  | { modo: "desfecho"; pedido: PedidoParaOperacao; status: "concluido" | "recusado" };

export function PedidosDoTitular({
  emAberto,
  respondidos,
  eliminacoes,
}: {
  emAberto: PedidoParaOperacao[];
  respondidos: PedidoParaOperacao[];
  eliminacoes: EliminacaoExecutada[];
}) {
  const router = useRouter();
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const nome = alvo?.pedido.nomeDoTitular ?? "";
  const motivoValido = motivo.trim().length >= 12 && motivo.trim().length <= 500;
  const confirmacaoValida = confirmacao.trim() === nome.trim() && nome.trim().length > 0;

  const fechar = useCallback(() => {
    if (pendente) return;
    setAlvo(null);
    setMotivo("");
    setConfirmacao("");
    setErro(null);
  }, [pendente]);

  function submeter() {
    if (!alvo || !motivoValido || pendente) return;
    if (alvo.modo === "eliminar" && !confirmacaoValida) return;
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const resultado =
        alvo.modo === "eliminar"
          ? await executarEliminacaoAction({
              requestId: alvo.pedido.id,
              profileId: alvo.pedido.profileId,
              motivo: motivo.trim(),
              confirmacao: confirmacao.trim(),
            })
          : await registrarDesfechoAction({
              requestId: alvo.pedido.id,
              status: alvo.status,
              desfecho: motivo.trim(),
            });
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }
      if (resultado.aviso) setAviso(resultado.aviso);
      setAlvo(null);
      setMotivo("");
      setConfirmacao("");
      router.refresh();
    });
  }

  function assumir(pedido: PedidoParaOperacao) {
    setErro(null);
    iniciar(async () => {
      const r = await assumirPedidoAction({ requestId: pedido.id });
      if (!r.success) setErro(r.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {aviso ? (
        <p
          role="status"
          className="rounded-md border border-attention bg-attention-surface px-3 py-2 text-sm text-ink"
        >
          {aviso}
        </p>
      ) : null}
      {erro && !alvo ? (
        <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro}
        </p>
      ) : null}

      <section aria-labelledby="em-aberto">
        <h2 id="em-aberto" className="mb-3 font-sans text-lg font-semibold text-ink">
          Esperando resposta
        </h2>

        {emAberto.length === 0 ? (
          <EmptyState
            title="Nenhum pedido esperando."
            description="Quando alguém pedir acesso, correção, eliminação, portabilidade ou revogação, o pedido aparece aqui com o prazo."
          />
        ) : (
          <ul className="space-y-4">
            {emAberto.map((pedido) => {
              const prazo = prazoDoPedido(pedido.criadoEm, pedido.prazoEm);
              return (
                <li
                  key={pedido.id}
                  className={`rounded-lg border bg-surface p-4 ${
                    prazo.urgente ? "border-attention" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {pedido.nomeDoTitular ?? "Pessoa já não cadastrada"}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {ROTULO_DO_TIPO[pedido.tipo]} · pedido em {data(pedido.criadoEm)} ·{" "}
                        {prazo.diasDecorridos === 0
                          ? "hoje"
                          : `há ${prazo.diasDecorridos} dia${prazo.diasDecorridos > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge variant={pedido.status === "em_execucao" ? "sage" : "default"}>
                        {ROTULO_DO_STATUS[pedido.status]}
                      </Badge>
                      <Badge variant={prazo.urgente ? "attention" : "default"}>
                        {prazo.vencido
                          ? `vencido há ${Math.abs(prazo.diasRestantes)} dia${Math.abs(prazo.diasRestantes) > 1 ? "s" : ""}`
                          : `${prazo.diasRestantes} dia${prazo.diasRestantes > 1 ? "s" : ""} até ${data(prazo.limite.toISOString())}`}
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-ink-muted">{COMO_SE_CUMPRE[pedido.tipo]}</p>

                  {!prazo.fixado ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      Prazo não fixado no pedido. A referência acima são{" "}
                      {PRAZO_PROPOSTO_EM_DIAS} dias corridos — a proposta da Política de
                      Privacidade, ainda pendente de confirmação jurídica.
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {pedido.status === "recebido" ? (
                      <Button variant="secondary" onClick={() => assumir(pedido)} disabled={pendente}>
                        Assumir
                      </Button>
                    ) : null}

                    {pedido.tipo === "exclusao" ? (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setAlvo({ modo: "eliminar", pedido });
                          setMotivo("");
                          setConfirmacao("");
                        }}
                        disabled={pendente || pedido.nomeDoTitular === null}
                      >
                        Executar a eliminação
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setAlvo({ modo: "desfecho", pedido, status: "concluido" });
                          setMotivo("");
                        }}
                        disabled={pendente}
                      >
                        Registrar que foi atendido
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAlvo({ modo: "desfecho", pedido, status: "recusado" });
                        setMotivo("");
                      }}
                      disabled={pendente}
                    >
                      Recusar com fundamentação
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {eliminacoes.length > 0 ? (
        <section aria-labelledby="eliminadas">
          <h2 id="eliminadas" className="mb-1 font-sans text-lg font-semibold text-ink">
            Eliminações executadas
          </h2>
          <p className="mb-3 text-sm text-ink-muted">
            O pedido de eliminação desaparece junto com a pessoa — é o que eliminar significa. O que
            fica é este registro de auditoria, sem nome.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {eliminacoes.map((e) => (
              <li key={e.id} className="px-4 py-3 text-sm">
                <p className="text-ink">
                  {data(e.executadoEm)} · {e.casesDescartados ?? 0} Case(s), {e.documentos ?? 0}{" "}
                  documento(s)
                  {e.orfaosDeStorage ? `, ${e.orfaosDeStorage} arquivo(s) sem registro` : ""}
                </p>
                {e.motivo ? <p className="mt-0.5 text-ink-muted">{e.motivo}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {respondidos.length > 0 ? (
        <section aria-labelledby="respondidos">
          <h2 id="respondidos" className="mb-3 font-sans text-lg font-semibold text-ink">
            Já respondidos
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {respondidos.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-ink">
                    {p.nomeDoTitular ?? "—"} · {ROTULO_DO_TIPO[p.tipo]}
                  </p>
                  <Badge variant={p.status === "recusado" ? "attention" : "sage"}>
                    {`${ROTULO_DO_STATUS[p.status]}${p.concluidoEm ? ` em ${data(p.concluidoEm)}` : ""}`}
                  </Badge>
                </div>
                {p.desfecho ? <p className="mt-1 text-ink-muted">{p.desfecho}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Dialog
        open={alvo !== null}
        onClose={fechar}
        title={
          alvo?.modo === "eliminar"
            ? "Executar a eliminação dos dados"
            : alvo?.status === "recusado"
              ? "Recusar o pedido, com fundamentação"
              : "Registrar que o pedido foi atendido"
        }
      >
        {alvo?.modo === "eliminar" ? (
          <div className="rounded-md border border-attention bg-attention-surface px-3 py-2 text-sm text-ink">
            <p className="font-medium">Isto não tem volta.</p>
            <p className="mt-1">
              Saem do banco: a conta, o perfil, os papéis, as histórias e todas as versões delas, os
              documentos e os arquivos no armazenamento, o contato do CRM, as notificações — e cada
              Case dela é descartado pela porta auditada. Fica só o registro de auditoria, sem nome.
            </p>
            <p className="mt-1">
              Se algum Case tiver julgamento do Curador, a eliminação é recusada pelo banco e nada
              acontece: julgamento não se apaga.
            </p>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="pedido-motivo" className="block text-sm font-medium text-ink">
              {alvo?.modo === "eliminar"
                ? "Motivo (fica na auditoria)"
                : alvo?.status === "recusado"
                  ? "Fundamentação da recusa (a pessoa recebe este texto)"
                  : "O que foi feito (a pessoa recebe este texto)"}
            </label>
            <Textarea
              id="pedido-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={
                alvo?.modo === "eliminar"
                  ? "Ex.: pedido de eliminação recebido por escrito em 03/09."
                  : "Ex.: cópia dos dados enviada por e-mail em 03/09, com o histórico completo."
              }
              error={motivo.length > 0 && !motivoValido}
            />
            <p className="mt-1 text-xs text-ink-muted">Entre 12 e 500 caracteres.</p>
          </div>

          {alvo?.modo === "eliminar" ? (
            <Input
              id="pedido-confirmacao"
              label={`Digite exatamente “${nome}” para confirmar`}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
              error={
                confirmacao.length > 0 && !confirmacaoValida ? "O nome não corresponde." : undefined
              }
            />
          ) : null}

          {erro ? (
            <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
              {erro}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={fechar} disabled={pendente}>
              Cancelar
            </Button>
            <Button
              variant={alvo?.modo === "eliminar" ? "danger" : "primary"}
              onClick={submeter}
              disabled={!motivoValido || (alvo?.modo === "eliminar" && !confirmacaoValida)}
              isLoading={pendente}
            >
              {alvo?.modo === "eliminar"
                ? "Eliminar definitivamente"
                : alvo?.status === "recusado"
                  ? "Registrar a recusa"
                  : "Registrar o atendimento"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
