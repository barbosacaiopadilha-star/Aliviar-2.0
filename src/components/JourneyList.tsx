import Link from "next/link";
import type { Journey, JourneyWithRelations } from "@/lib/types/database";
import { displayPatientName } from "@/lib/types/database";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function JourneyList({
  journeys,
  emptyTitle = "Nenhuma Jornada encontrada",
}: {
  journeys: Array<Journey | JourneyWithRelations>;
  emptyTitle?: string;
}) {
  if (journeys.length === 0) {
    return <EmptyState title={emptyTitle} description="As Jornadas aparecerão aqui quando forem criadas." />;
  }

  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Paciente</th>
            <th>Gestor</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Abertura</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {journeys.map((journey) => {
            const withRelations = journey as JourneyWithRelations;
            return (
              <tr key={journey.id}>
                <td className="font-medium">{journey.title}</td>
                <td>
                  {withRelations.patient
                    ? displayPatientName(withRelations.patient)
                    : "—"}
                </td>
                <td>{withRelations.manager?.full_name ?? "—"}</td>
                <td>
                  <StatusBadge status={journey.status} kind="journey" />
                </td>
                <td>
                  <PriorityBadge priority={journey.priority} />
                </td>
                <td>{formatDate(journey.opened_at)}</td>
                <td>
                  <Link href={`/journeys/${journey.id}`} className="text-sm font-semibold text-coral">
                    Abrir
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
