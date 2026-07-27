"use client";

/**
 * Evidências como chips — Progressive Disclosure na ficha do profissional.
 *
 * @metodo Engine §5.5 — o Curador vê tudo do caso; lacuna aparece como lacuna
 * @metodo Fundamentos §13 — evidência sustenta a avaliação; nunca é a avaliação
 *
 * Por que existe: a ficha inteira do profissional na tela é a forma mais
 * rápida de o Curador parar de ler. Em chips ele vê num relance o que existe,
 * o que diverge e o que falta — e abre só o que a decisão de agora exige.
 *
 * O que nunca faz: esconder divergência ou ausência. Ausente aparece com
 * traço, divergente com marca própria — nenhum dos dois some para a fileira
 * ficar bonita.
 */

import { useId, useState } from "react";

import { cn } from "@/components/ui/cn";

export type EvidenciaEstado = "verificado" | "divergente" | "ausente" | "nao_verificado";

export type Evidencia = {
  id: string;
  label: string;
  estado: EvidenciaEstado;
  /** O que se sabe, com proveniência. Aparece ao abrir. */
  detalhe: string;
};

const MARCA: Record<EvidenciaEstado, string> = {
  verificado: "✓",
  divergente: "⚠",
  ausente: "–",
  nao_verificado: "○",
};

const ESTADO_LABEL: Record<EvidenciaEstado, string> = {
  verificado: "verificado",
  divergente: "fontes divergem",
  ausente: "não registrado",
  nao_verificado: "registrado, não verificado",
};

const CLASSE: Record<EvidenciaEstado, string> = {
  verificado: "mesa-chip--ok",
  divergente: "mesa-chip--alerta",
  ausente: "mesa-chip--ausente",
  nao_verificado: "",
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
        <p id={painelId} className="mt-3 max-w-reading text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{detalhe.label}:</span> {detalhe.detalhe}
        </p>
      ) : (
        <div id={painelId} hidden />
      )}
    </div>
  );
}
