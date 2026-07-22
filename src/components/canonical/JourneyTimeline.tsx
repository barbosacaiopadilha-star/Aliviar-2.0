import type { TimelineItemView } from "@/experience-flow/contracts/jornada-view";

interface JourneyTimelineProps {
  items: TimelineItemView[];
}

export function JourneyTimeline({ items }: JourneyTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-soft" data-testid="journey-timeline-empty">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-4" data-testid="journey-timeline" aria-label="Linha do tempo da jornada">
      {items.map((item) => (
        <li key={item.id} className="card p-4" data-testid={`timeline-item-${item.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{item.titulo}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.descricao}</p>
            </div>
            <time
              className="shrink-0 text-xs text-ink-soft"
              dateTime={item.ocorrido_em}
            >
              {new Date(item.ocorrido_em).toLocaleDateString("pt-BR")}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
