import { EmptyState } from "@/components/ui/empty-state";
import type { CaseEvent } from "@/modules/cases/types";

type CaseEventsTimelineProps = {
  events: CaseEvent[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function describe(event: CaseEvent): string {
  const actor = event.actorName ?? "Sistema";

  switch (event.eventType) {
    case "created":
      return `${actor} criou o caso`;
    case "status_changed":
      return `${actor} mudou o status de "${event.fromLabel ?? "—"}" para "${event.toLabel ?? "—"}"`;
    case "curator_assigned":
      return `${actor} reatribuiu o caso de ${event.fromLabel ?? "ninguém"} para ${event.toLabel ?? "ninguém"}${event.reason ? ` — ${event.reason}` : ""}`;
    default:
      return `${actor} registrou um evento`;
  }
}

export function CaseEventsTimeline({ events }: CaseEventsTimelineProps) {
  if (events.length === 0) {
    return <EmptyState title="Ainda não há eventos registrados." description="A linha do tempo aparece aqui." />;
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 py-3 text-sm">
          <span className="text-ink">{describe(event)}</span>
          <span className="text-xs text-ink-muted">{formatDate(event.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
