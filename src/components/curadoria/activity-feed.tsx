/**
 * Atividades recentes do Curador.
 *
 * @metodo Engine §7 — catálogo de eventos; toda atividade é um evento nomeado
 * @metodo Engine §5.6 — trilha append-only, sempre com autor e instante
 * @metodo Experience §5 — UX6: a pessoa sempre entende por que algo aconteceu
 *
 * Por que existe: o Curador precisa retomar o contexto ao voltar ao Portal —
 * o que mudou desde a última vez, e por causa de quem. Cada linha nomeia o
 * autor, inclusive quando o autor é o Sistema: isso torna visível, no uso
 * diário, a fronteira entre o que a máquina fez e o que uma pessoa decidiu.
 *
 * O que nunca faz: agregar em número ("12 atividades hoje"). Contagem de
 * atividade é métrica de produtividade, e o Portal não tem painel de métricas
 * (Experience §3).
 */

import Link from "next/link";

import type { ActivityEvent } from "@/modules/curadoria/portal/mock-data";

/** Tradução do evento técnico para linguagem de pessoa (Engine §4.6). */
const EVENT_LABELS: Record<string, string> = {
  PERFIL_VALIDADO: "Perfil validado",
  PESO_ATRIBUIDO: "Peso atribuído",
  MEDICO_ELIMINADO: "Profissionais eliminados por restrição",
  RELATORIO_ENTREGUE: "Relatório entregue",
  CONFLITO_DETECTADO: "Conflito detectado",
  ESCOLHA_REGISTRADA: "Escolha registrada",
  CURADORIA_INICIADA: "Curadoria iniciada",
};

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ul className="divide-y divide-border">
      {events.map((event) => (
        <li key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-ink">
              {EVENT_LABELS[event.event] ?? event.event}
            </span>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <Link
              href={`/portal-curador/casos/${event.caseId}`}
              className="text-sm text-brand-primary underline-offset-4 hover:underline"
            >
              {event.patientFirstName}
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">{event.description}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {event.actor} <span aria-hidden="true">·</span> {formatMoment(event.at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
