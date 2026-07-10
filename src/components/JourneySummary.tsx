import Link from "next/link";
import type { JourneyWithRelations } from "@/lib/types/database";
import { displayPatientName, USER_ROLE_LABELS } from "@/lib/types/database";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function JourneySummary({ journey }: { journey: JourneyWithRelations }) {
  return (
    <div className="card grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Paciente</p>
        <p className="mt-1 font-medium">
          {journey.patient ? (
            <Link href={`/patients/${journey.patient.id}`} className="text-coral">
              {displayPatientName(journey.patient)}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Título da Jornada</p>
        <p className="mt-1 font-serif text-xl font-semibold">{journey.title}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Status</p>
        <div className="mt-1">
          <StatusBadge status={journey.status} kind="journey" />
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Prioridade</p>
        <div className="mt-1">
          <PriorityBadge priority={journey.priority} />
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Gestor</p>
        <p className="mt-1">
          {journey.manager
            ? `${journey.manager.full_name} (${USER_ROLE_LABELS[journey.manager.role]})`
            : "—"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Abertura</p>
        <p className="mt-1">{formatDate(journey.opened_at)}</p>
      </div>
      {journey.objective && (
        <div className="md:col-span-2 lg:col-span-3">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Objetivo</p>
          <p className="mt-1 text-sm">{journey.objective}</p>
        </div>
      )}
    </div>
  );
}
