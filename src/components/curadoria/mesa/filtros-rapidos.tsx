"use client";

/**
 * FILTROS INSTANTÂNEOS — recortam a leitura, nunca a Rede.
 *
 * @metodo Engine §5.5 — o Curador vê tudo do caso
 * @metodo Ontologia §3.13 — ordem de leitura, jamais colocação
 *
 * Por que existe: com a Rede crescendo, achar "quem ainda não foi avaliado"
 * custava percorrer a lista inteira. Aqui é um toque, sem menu, sem reload,
 * sem sair da etapa.
 *
 * O que nunca faz: esconder em silêncio. Todo recorte vem acompanhado de
 * quantos estão sendo exibidos de quantos existem — senão o Curador decide
 * sobre um universo que ele acha que é o todo.
 */

import { cn } from "@/components/ui/cn";
import type { FiltroView, MesaFiltroId } from "@/modules/curadoria/mesa-investigacao";

export function FiltrosRapidos({
  filtros,
  resumo,
  onAlternar,
  onLimpar,
  id,
}: {
  filtros: FiltroView[];
  /** "4 de 9 exibidos — 1 filtro ativo." */
  resumo: string;
  onAlternar: (filtro: MesaFiltroId) => void;
  onLimpar: () => void;
  id?: string;
}) {
  const ativos = filtros.filter((filtro) => filtro.ativo).length;

  return (
    <div className="mesa-filtros" id={id}>
      <ul className="flex flex-wrap gap-1.5" aria-label="Filtros rápidos">
        {filtros.map((filtro) => (
          <li key={filtro.id}>
            <button
              type="button"
              aria-pressed={filtro.ativo}
              onClick={() => onAlternar(filtro.id)}
              className={cn("mesa-chip", filtro.ativo && "mesa-chip--ativo")}
            >
              {filtro.label}
              <span className="mesa-chip__contagem">{filtro.count}</span>
            </button>
          </li>
        ))}

        {ativos > 0 ? (
          <li>
            <button type="button" onClick={onLimpar} className="mesa-filtros__limpar">
              Limpar
            </button>
          </li>
        ) : null}
      </ul>

      <p aria-live="polite" className="mt-2 text-xs text-ink-muted">
        {resumo}
      </p>
    </div>
  );
}
