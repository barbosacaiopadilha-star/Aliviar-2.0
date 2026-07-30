"use client";

/**
 * Chips inteligentes — cada chip é um estado completo, não um rótulo.
 *
 * @metodo Engine §5.5 — o Curador vê tudo do caso; lacuna aparece como lacuna
 * @metodo Fundamentos §13 — evidência sustenta a avaliação; nunca é a avaliação
 * @metodo Política de Fontes §3 — proveniência e data acompanham o que foi verificado
 *
 * Por que existe: a ficha inteira do profissional na tela é a forma mais
 * rápida de o Curador parar de ler. Em chips ele vê num relance o que existe,
 * o que diverge e o que falta — e abre só o que a decisão de agora exige.
 * Aberto, o chip entrega a evidência inteira: fonte, data, proveniência,
 * observações e histórico. Sem abrir outra tela, sem perder o lugar.
 *
 * O que nunca faz: esconder divergência ou ausência. Ausente aparece com
 * traço, divergente com marca própria — nenhum dos dois some para a fileira
 * ficar bonita. E nenhum estado se distingue só por cor.
 */

import { useId, useState } from "react";

import { cn } from "@/components/ui/cn";

export type EvidenciaEstado = "verificado" | "divergente" | "ausente" | "nao_verificado";

export type Evidencia = {
  id: string;
  label: string;
  estado: EvidenciaEstado;
  /** O que se sabe, em uma frase. Aparece ao abrir. */
  detalhe: string;
  /** Quem afirma — conselho, instituição, o próprio profissional. */
  fonte?: string;
  /** Quando foi consultado ou registrado. */
  data?: string;
  /** Como se chegou até aqui: link, ofício, consulta, autodeclaração. */
  proveniencia?: string;
  /** O que o Curador precisa saber e não cabe nas linhas acima. */
  observacoes?: string;
  /** O que já se registrou antes sobre esta mesma evidência. */
  historico?: string[];
};

const MARCA: Record<EvidenciaEstado, string> = {
  verificado: "✓",
  divergente: "⚠",
  ausente: "–",
  nao_verificado: "⟳",
};

const ESTADO_LABEL: Record<EvidenciaEstado, string> = {
  verificado: "verificado",
  divergente: "fontes divergem",
  ausente: "não registrado",
  nao_verificado: "aguardando verificação",
};

const CLASSE: Record<EvidenciaEstado, string> = {
  verificado: "mesa-chip--ok",
  divergente: "mesa-chip--alerta",
  ausente: "mesa-chip--ausente",
  nao_verificado: "mesa-chip--aguardando",
};

export function EvidenciaChips({ evidencias }: { evidencias: Evidencia[] }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const painelId = useId();

  if (evidencias.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhuma evidência registrada para este profissional ainda.
      </p>
    );
  }

  const detalhe = evidencias.find((evidencia) => evidencia.id === aberta);

  return (
    <div>
      <ul className="flex flex-wrap gap-1.5">
        {evidencias.map((evidencia) => (
          <li key={evidencia.id}>
            <button
              type="button"
              aria-expanded={aberta === evidencia.id}
              aria-controls={painelId}
              onClick={() => setAberta(aberta === evidencia.id ? null : evidencia.id)}
              className={cn("mesa-chip", CLASSE[evidencia.estado])}
            >
              <span aria-hidden="true">{MARCA[evidencia.estado]}</span>
              {evidencia.label}
              <span className="sr-only">, {ESTADO_LABEL[evidencia.estado]}</span>
            </button>
          </li>
        ))}
      </ul>

      {detalhe ? (
        <div id={painelId} className="mesa-chip__detalhe">
          <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">{detalhe.label}:</span> {detalhe.detalhe}
          </p>

          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            <Linha termo="Fonte" valor={detalhe.fonte} />
            <Linha termo="Data" valor={detalhe.data} />
            <Linha termo="Proveniência" valor={detalhe.proveniencia} />
            <Linha termo="Observações" valor={detalhe.observacoes} />
          </dl>

          {detalhe.historico && detalhe.historico.length > 0 ? (
            <div className="mt-2">
              <p className="mesa-rotulo">Histórico</p>
              <ul className="mt-1 space-y-0.5 text-xs text-ink-muted">
                {detalhe.historico.map((entrada) => (
                  <li key={entrada}>{entrada}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div id={painelId} hidden />
      )}
    </div>
  );
}

/**
 * Campo ausente é dito, não omitido: "sem registro" informa; a linha que some
 * deixa o Curador achando que a evidência estava completa.
 */
function Linha({ termo, valor }: { termo: string; valor?: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-muted">{termo}:</dt>
      <dd className={valor ? "text-ink" : "text-ink-muted"}>{valor ?? "sem registro"}</dd>
    </div>
  );
}
