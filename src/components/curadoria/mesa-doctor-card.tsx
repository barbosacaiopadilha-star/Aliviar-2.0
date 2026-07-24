"use client";

/**
 * Medical Profile Card + Compatibility — Área 3 da Mesa de Curadoria.
 *
 * @metodo Fundamentos §13 — P6: o universo é fechado e previamente aprovado; nunca busca automática
 * @metodo Ontologia §3.10 — compatibilidade é característica da relação, nunca do médico
 * @metodo Engine §5.5 — score interno e cobertura são ferramenta do Curador; a conta fica à vista
 * @metodo Experience §3 — o cálculo vem com a decomposição, porque o Curador vai ter que explicá-lo
 *
 * Por que existe: cada profissional elegível precisa ser compreensível em um
 * olhar — quem é, como se alinha ao Perfil deste paciente, e onde falta dado.
 * A compatibilidade aparece sempre como "compatibilidade com o Perfil de
 * Prioridades", nunca como nota do médico.
 *
 * O que nunca faz: ranking, selo de "melhor", pré-seleção, ou esconder lacuna
 * de cadastro — ausência de dado aparece neutra, nunca vermelha (falta de
 * informação não é falha do profissional).
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { COMPATIBILITY_BAND_LABELS, PRIORITY_CRITERION_LABELS } from "@/modules/curadoria/types";
import type { AnaliseRecord } from "@/modules/curadoria/cos/types";

type MesaDoctorCardProps = {
  analysis: AnaliseRecord;
  inComparison: boolean;
  selected: boolean;
  selectionFull: boolean;
  disabled: boolean;
  onToggleComparison: () => void;
  onToggleSelection: () => void;
};

export function MesaDoctorCard({
  analysis,
  inComparison,
  selected,
  selectionFull,
  disabled,
  onToggleComparison,
  onToggleSelection,
}: MesaDoctorCardProps) {
  const [open, setOpen] = useState(false);
  const gaps = analysis.criteria.filter((entry) => entry.alignment === null).length;

  return (
    <Card className={cn("space-y-4", selected && "border-brand-primary/50")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-ink">{analysis.professionalName}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Aprovado pela Aliviar — critério próprio, anterior a este caso.
          </p>
        </div>
        {selected ? <Badge variant="sage">Selecionado</Badge> : null}
      </div>

      <div className="rounded-md bg-canvas p-3">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Compatibilidade com o Perfil de Prioridades
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-ink">
            {COMPATIBILITY_BAND_LABELS[analysis.band]}
          </span>
          <span className="tabular-nums text-xs text-ink-muted" title="Nível interno — ferramenta sua, nunca do paciente">
            interno {analysis.internalScore.toFixed(1)} · {analysis.coveredWeight} de 100 pontos
            avaliáveis
          </span>
        </div>
        {gaps > 0 ? (
          <p className="mt-1 text-xs text-ink-muted">
            {gaps === 1 ? "1 critério sem dado no cadastro" : `${gaps} critérios sem dado no cadastro`}{" "}
            — não pontuou e não penalizou.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {open ? "Fechar a conta" : "Ver a conta, critério a critério"}
      </button>

      {open ? (
        <ul className="space-y-2 border-t border-border pt-3">
          {analysis.criteria.map((entry) => (
            <li key={entry.criterion} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink">
                  {PRIORITY_CRITERION_LABELS[entry.criterion]}{" "}
                  <span className="text-xs text-ink-muted">(peso {entry.weight})</span>
                </span>
                <span className="tabular-nums text-xs text-ink-muted">
                  {entry.alignment === null ? "sem dado" : `alinhamento ${entry.alignment}`}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{entry.explanation}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {analysis.curatorNote ? (
        <p className="border-l-2 border-brand-gold/50 pl-2 text-xs italic leading-relaxed text-ink-muted">
          Sua observação: {analysis.curatorNote}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onToggleComparison}
          disabled={disabled}
          className={cn(
            "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            "disabled:cursor-not-allowed disabled:opacity-60",
            inComparison
              ? "border-brand-primary/40 bg-canvas text-brand-primary-deep"
              : "border-border bg-surface text-ink hover:border-brand-primary/40",
          )}
        >
          {inComparison ? "Tirar da comparação" : "Comparar"}
        </button>

        <button
          type="button"
          onClick={onToggleSelection}
          disabled={disabled || (!selected && selectionFull)}
          className={cn(
            "inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            "disabled:cursor-not-allowed disabled:opacity-60",
            selected
              ? "border border-border bg-surface text-ink hover:bg-canvas"
              : "bg-brand-primary text-surface hover:bg-brand-primary-deep",
          )}
        >
          {selected ? "Remover da seleção" : "Selecionar"}
        </button>

        {!selected && selectionFull && !disabled ? (
          // Nunca um botão cinza sem explicação (Experience §6).
          <p className="text-xs text-ink-muted">
            As três já estão selecionadas — remova uma para trocar.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
