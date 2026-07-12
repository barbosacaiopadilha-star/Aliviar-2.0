"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ACE_EXECUTION_EVENT_LABELS, type AceExecutionEvent } from "@/modules/concierge/types";

import { JsonViewer } from "./json-viewer";

type AceExecutionTimelineProps = {
  events: AceExecutionEvent[];
};

const WARNING_EVENT_CLASS = "text-error";

function badgeClassName(eventType: AceExecutionEvent["eventType"]): string {
  if (eventType === "BLOCKED" || eventType === "FAILED") return WARNING_EVENT_CLASS;
  return "";
}

// Renderização humana do log estruturado (ace_execution_events) — a fonte
// bruta continua disponível via "Ver log estruturado (JSON)" logo abaixo,
// para quem precisa do dado exato em vez da narrativa.
export function AceExecutionTimeline({ events }: AceExecutionTimelineProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (events.length === 0) {
    return <EmptyState title="Nenhum evento registrado ainda para esta execução." />;
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-3 border-l border-border pl-4">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.15rem] top-1.5 size-2 rounded-full bg-brand-primary" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={badgeClassName(event.eventType)}>{ACE_EXECUTION_EVENT_LABELS[event.eventType]}</Badge>
              {event.protocolId ? <span className="text-xs font-medium text-ink-muted">{event.protocolId}</span> : null}
              <span className="text-xs text-ink-muted">{new Date(event.createdAt).toLocaleString("pt-BR")}</span>
            </div>
            <p className="mt-1 text-sm text-ink">{event.message}</p>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setShowRaw((current) => !current)}
        className="text-xs font-medium text-brand-primary hover:text-brand-primary-deep"
      >
        {showRaw ? "Ocultar log estruturado (JSON)" : "Ver log estruturado (JSON)"}
      </button>
      {showRaw ? <JsonViewer value={events} /> : null}
    </div>
  );
}
