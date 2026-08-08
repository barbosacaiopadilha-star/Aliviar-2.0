"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  confirmarItemDaFronteiraAction,
  recusarItemDaFronteiraAction,
  type DesfechoDaFronteira,
} from "@/modules/curadoria/fronteira-do-mapa-actions";
import type { ItemDaFronteira } from "@/modules/curadoria/fronteira-do-mapa-repository";

/**
 * O PAINEL DA FRONTEIRA (Item 2.C §10) — a superfície interna, item a item.
 *
 * Cada item exibe os NOVE elementos do A2c antes de qualquer ato — a decisão
 * nunca aparece sem a proveniência inteira (G-2.C-4). Os dois atos são
 * EQUIVALENTES por construção: mesmos botões irmãos, mesmo contêiner, mesma
 * hierarquia, UM clique cada (O2-A/O2-B); o motivo é um campo único opcional
 * que serve aos dois (P-10). Pendente é a leitura da ausência — nada nasce
 * pré-marcado, e nenhum efeito acontece sem ato explícito (A2d).
 */

const DESFECHO_LEGIVEL: Record<DesfechoDaFronteira["desfecho"], string> = {
  ATO_REGISTRADO: "Ato registrado.",
  ATO_JA_REGISTRADO: "Você já havia registrado exatamente este ato.",
  ATO_JA_CONSUMADO: "Esta proposta já foi decidida.",
  PROPOSTA_NAO_DECIDIVEL: "A proposta não está mais decidível — a origem mudou ou o Mapa já foi declarado.",
  PROPOSTA_INEXISTENTE: "Proposta não encontrada.",
  SEM_AUTORIDADE: "Você não tem autoridade para decidir este item.",
  NATUREZA_INVALIDA: "Ato inválido.",
  MOTIVO_INVALIDO: "O motivo excede o formato (280 caracteres).",
  ERRO_TECNICO: "Não foi possível concluir o ato agora.",
};

function ItemPendente({ item }: { item: ItemDaFronteira }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  const agir = (natureza: "CONFIRMACAO" | "RECUSA") => {
    startTransition(async () => {
      const acao =
        natureza === "CONFIRMACAO" ? confirmarItemDaFronteiraAction : recusarItemDaFronteiraAction;
      const saida = await acao({ proposalId: item.proposalId, motivo: motivo || null });
      setResultado(DESFECHO_LEGIVEL[saida.desfecho]);
      if (saida.desfecho === "ATO_REGISTRADO") router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <input
        aria-label="Motivo (opcional para os dois atos)"
        className="w-full rounded-md border border-edge bg-transparent p-2 text-xs"
        maxLength={280}
        placeholder="Motivo (opcional — vale para confirmar e para recusar)"
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      />
      {/* O2-A/O2-B: os dois atos são IRMÃOS — mesmo contêiner, mesma classe,
          mesmo custo (um clique). Nenhum é CTA dominante; nenhum vive em
          menu. */}
      <div className="grid grid-cols-2 gap-2" data-testid={`atos-${item.proposalId}`}>
        <button
          type="button"
          className="rounded-md border border-edge px-3 py-2 text-sm font-medium disabled:opacity-50"
          disabled={pending}
          onClick={() => agir("CONFIRMACAO")}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="rounded-md border border-edge px-3 py-2 text-sm font-medium disabled:opacity-50"
          disabled={pending}
          onClick={() => agir("RECUSA")}
        >
          Recusar
        </button>
      </div>
      {resultado ? <p className="text-xs text-ink-muted">{resultado}</p> : null}
    </div>
  );
}

export function PainelDaFronteira({ itens }: { itens: ItemDaFronteira[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-sm text-ink-muted" data-testid="fronteira-vazia">
        Nenhuma proposta de estado emitida — o mecanismo está aberto e vazio-honesto: propostas
        nascem quando a primeira regra de correspondência for lavrada pela Autoridade de Método.
        Discordância zero aqui não é sucesso; é ausência de matéria.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {itens.map((item) => (
        <article
          key={item.proposalId}
          className="rounded-lg border border-edge p-4 space-y-3"
          data-testid={`item-${item.proposalId}`}
        >
          <header className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">
              {item.professionalName} · {item.conceptName}
            </h3>
            {/* Elemento 8 — o desfecho registrado; pendente é leitura. */}
            <span className="text-[11px] uppercase tracking-wide text-ink-muted" data-testid="desfecho">
              {item.state === "PROPOSTA" ? "Aguardando decisão" : item.state}
            </span>
          </header>

          {/* Elemento 2 — a proposta. */}
          <p className="text-sm" data-testid="proposta">
            Estado proposto: <strong>{item.suggestedStatus}</strong>
          </p>

          {/* Elemento 1 — a declaração original, exata. */}
          <div className="text-xs text-ink-muted" data-testid="declaracao-original">
            Declaração original: {item.origem.resumo} · {item.origem.record} · v
            {item.origem.version}
            {item.origem.verificationStatus ? ` · ${item.origem.verificationStatus}` : null}
          </div>

          {/* Elemento 3 — a origem (registro, versão, data, autor). */}
          <div className="text-xs text-ink-muted" data-testid="origem">
            Origem declarada em {new Date(item.origem.declaredAt).toLocaleDateString("pt-BR")} —
            autoria da coleta registrada.
          </div>

          {/* Elemento 4 — a regra aplicada, com versão. */}
          <div className="text-xs text-ink-muted" data-testid="regra">
            Regra {item.regra.ruleId} v{item.regra.ruleVersion} · Catálogo{" "}
            {item.regra.catalogVersion} · emitida em{" "}
            {new Date(item.regra.emittedAt).toLocaleDateString("pt-BR")}
          </div>

          {item.mapaAtual ? (
            <div className="text-xs text-ink-muted" data-testid="mapa-atual">
              Mapa atual: {item.mapaAtual.status}
              {item.mapaAtual.evidenceId ? " (com vínculo de evidência)" : null}
            </div>
          ) : null}

          {item.julgamentoVigente ? (
            <div className="text-xs text-ink-muted" data-testid="julgamento-associado">
              Juízo do Curador (leitura): “{item.julgamentoVigente.conclusao}” · v
              {item.julgamentoVigente.versao}
            </div>
          ) : null}

          {item.state === "PROPOSTA" ? (
            // Elementos 5 e 9 — os dois atos equivalentes; sem ato, nada
            // avança (o bloqueio é a própria ausência: nenhum efeito nasce
            // daqui sem clique explícito).
            <ItemPendente item={item} />
          ) : item.ato ? (
            // Elementos 6 e 7 — autoria e data do desfecho.
            <p className="text-xs text-ink-muted" data-testid="autoria-do-ato">
              {item.ato.natureza === "CONFIRMACAO" ? "Confirmada" : "Recusada"} por{" "}
              {item.ato.actorName} em {new Date(item.ato.actedAt).toLocaleString("pt-BR")}.
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
