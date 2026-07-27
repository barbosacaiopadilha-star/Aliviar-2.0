"use client";

/**
 * ATALHOS — as mãos ficam no teclado, e a ajuda cabe numa tecla.
 *
 * Por que existe: o Curador repete os mesmos quatro movimentos por horas.
 * Cada um custava deslocamento de mouse e cliques que não decidiam nada.
 *
 * O que nunca faz: executar ato irreversível. `R` leva ao Relatório; gerar,
 * aprovar e emitir continuam sendo clique deliberado, na etapa própria. Uma
 * tecla encostada não emite documento para paciente nenhum.
 */

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { MESA_ATALHOS, acaoDaTecla, ehCampoDeTexto, type MesaAcao } from "@/modules/curadoria/mesa-atalhos";

export function useAtalhosDaMesa(executar: (acao: MesaAcao) => void, ativo = true) {
  useEffect(() => {
    if (!ativo) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (ehCampoDeTexto(evento.target)) return;
      const acao = acaoDaTecla(evento.key, {
        ctrl: evento.ctrlKey,
        meta: evento.metaKey,
        alt: evento.altKey,
      });
      if (!acao) return;
      evento.preventDefault();
      executar(acao);
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [executar, ativo]);
}

export function AjudaRapida({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  if (!aberta) {
    return null;
  }

  return (
    <div className="mesa-ajuda" role="dialog" aria-modal="false" aria-label="Atalhos da Mesa">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="mesa-rotulo">Atalhos</h2>
        <Button type="button" variant="ghost" onClick={onFechar}>
          Fechar
        </Button>
      </div>

      <dl className="mt-2 space-y-1 text-xs">
        {MESA_ATALHOS.map((atalho) => (
          <div key={atalho.acao} className="flex gap-2">
            <dt className="mesa-tecla">{atalho.legenda}</dt>
            <dd className="text-ink-muted">{atalho.descricao}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 max-w-reading text-xs text-ink-muted">
        Nenhum atalho gera, aprova ou emite o Relatório. Atos irreversíveis continuam sendo clique,
        na etapa própria.
      </p>
    </div>
  );
}

export function AtalhosDica({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button type="button" className="mesa-ajuda__dica" onClick={onAbrir}>
      Atalhos <span className="mesa-tecla">?</span>
    </button>
  );
}
