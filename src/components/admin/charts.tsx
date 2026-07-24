import type { FunnelStep, SeriesPoint, Slice } from "@/modules/admin/dashboard-metrics";

import { ChartFrame } from "./chart-frame";

/**
 * Gráficos do painel executivo, em SVG e CSS puros.
 *
 * @metodo Correção do Administrador §7 — não depender apenas de cor
 *
 * Sem biblioteca de gráficos, por três motivos concretos: o peso não se
 * justifica para barras e uma linha; o SVG do servidor aparece sem JavaScript;
 * e nada aqui depende de cor sozinha — cada barra carrega o número escrito ao
 * lado, e cada série da linha tem forma própria além do tom. Quem não
 * distingue as cores lê os mesmos fatos.
 */

const BAR_TONES = [
  "var(--color-brand-primary)",
  "var(--color-brand-primary-deep)",
  "var(--color-brand-gold)",
  "var(--color-ink-muted)",
];

function pct(value: number, max: number): number {
  return max === 0 ? 0 : Math.max(2, Math.round((value / max) * 100));
}

// ---------------------------------------------------------------------------

export function FunnelChart({ steps }: { steps: FunnelStep[] | null }) {
  const max = steps?.[0]?.value ?? 0;

  return (
    <ChartFrame
      title="Funil operacional"
      question="Onde a operação está perdendo gente entre o primeiro contato e o encerramento?"
      unit="pessoas"
      unavailable={steps === null}
      isEmpty={steps !== null && steps.every((s) => s.value === 0)}
      rows={(steps ?? []).map((s) => ({ label: s.label, value: String(s.value) }))}
    >
      <ol className="space-y-1.5">
        {(steps ?? []).map((step, index) => {
          const anterior = index > 0 ? (steps ?? [])[index - 1].value : null;
          // A queda entre degraus é o que importa — o número absoluto sozinho
          // não diz onde está o vazamento.
          const queda = anterior !== null && anterior > 0 ? Math.round(((anterior - step.value) / anterior) * 100) : null;

          return (
            <li key={step.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-ink-muted">{step.label}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className="h-5 rounded-sm"
                  style={{ width: `${pct(step.value, max)}%`, background: BAR_TONES[index % BAR_TONES.length] }}
                />
                <span className="shrink-0 text-xs font-medium tabular-nums text-ink">{step.value}</span>
                {queda !== null && queda > 0 ? (
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">−{queda}%</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------

export function BarsChart({
  title,
  question,
  unit,
  slices,
  emptyMessage,
}: {
  title: string;
  question: string;
  unit: string;
  slices: Slice[] | null;
  emptyMessage?: string;
}) {
  const max = Math.max(0, ...(slices ?? []).map((s) => s.value));

  return (
    <ChartFrame
      title={title}
      question={question}
      unit={unit}
      unavailable={slices === null}
      isEmpty={slices !== null && slices.every((s) => s.value === 0)}
      emptyMessage={emptyMessage}
      rows={(slices ?? []).map((s) => ({ label: s.label, value: String(s.value) }))}
    >
      <ul className="space-y-1.5">
        {(slices ?? []).map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-xs text-ink-muted" title={slice.label}>
              {slice.label}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-5 rounded-sm"
                style={{ width: `${pct(slice.value, max)}%`, background: BAR_TONES[index % BAR_TONES.length] }}
              />
              <span className="shrink-0 text-xs font-medium tabular-nums text-ink">{slice.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------

const SERIES: { key: keyof Omit<SeriesPoint, "date">; label: string; tone: string; dash: string }[] = [
  { key: "leads", label: "Leads recebidos", tone: "var(--color-brand-primary)", dash: "0" },
  { key: "convertidos", label: "Pacientes convertidos", tone: "var(--color-brand-gold)", dash: "5 3" },
  { key: "casesAbertos", label: "Cases abertos", tone: "var(--color-brand-primary-deep)", dash: "2 2" },
  { key: "casesConcluidos", label: "Cases concluídos", tone: "var(--color-ink-muted)", dash: "8 2 2 2" },
];

export function TrendChart({ points }: { points: SeriesPoint[] | null }) {
  const W = 640;
  const H = 160;
  const max = Math.max(1, ...(points ?? []).flatMap((p) => SERIES.map((s) => p[s.key])));
  const n = points?.length ?? 0;

  const path = (key: keyof Omit<SeriesPoint, "date">) =>
    (points ?? [])
      .map((p, i) => {
        const x = n <= 1 ? 0 : (i / (n - 1)) * W;
        const y = H - (p[key] / max) * H;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <ChartFrame
      title="Evolução no período"
      question="A operação está melhorando ou piorando ao longo do tempo?"
      unit="ocorrências por dia"
      unavailable={points === null}
      isEmpty={points !== null && points.every((p) => SERIES.every((s) => p[s.key] === 0))}
      rows={(points ?? [])
        .filter((p) => SERIES.some((s) => p[s.key] > 0))
        .map((p) => ({
          label: p.date,
          value: SERIES.map((s) => `${s.label}: ${p[s.key]}`).join(" · "),
        }))}
      legend={SERIES.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true" className="shrink-0">
            <line x1="0" y1="4" x2="20" y2="4" stroke={s.tone} strokeWidth="2" strokeDasharray={s.dash} />
          </svg>
          {s.label}
        </span>
      ))}
    >
      {/* A escala máxima vai no rótulo, não só na altura — sem ela a linha
          sobe igual com 3 ou com 300. */}
      <div className="flex gap-2">
        <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">{max}</span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-40 w-full min-w-[420px]"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Evolução diária de leads, conversões e Cases. Máximo de ${max} ocorrências em um dia.`}
        >
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={path(s.key)}
              fill="none"
              stroke={s.tone}
              strokeWidth="2"
              strokeDasharray={s.dash}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      {points && points.length > 1 ? (
        <p className="mt-1 flex justify-between text-[10px] text-ink-muted">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
        </p>
      ) : null}
    </ChartFrame>
  );
}
