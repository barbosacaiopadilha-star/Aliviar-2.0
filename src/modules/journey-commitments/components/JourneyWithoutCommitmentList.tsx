import Link from "next/link";
import type { JourneyWithRelations } from "@/lib/types/database";
import { displayPatientName } from "@/lib/types/database";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function JourneyWithoutCommitmentList({
  journeys,
}: {
  journeys: JourneyWithRelations[];
}) {
  if (journeys.length === 0) {
    return (
      <div className="card p-6 text-sm text-ink-soft">
        Todas as Jornadas ativas possuem compromisso em aberto.
      </div>
    );
  }

  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Jornada</th>
            <th>Gestor</th>
            <th>Abertura</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {journeys.map((journey) => (
            <tr key={journey.id}>
              <td className="font-medium">
                {journey.patient ? displayPatientName(journey.patient) : "—"}
              </td>
              <td>{journey.title}</td>
              <td>{journey.manager?.full_name ?? "—"}</td>
              <td>{formatDate(journey.opened_at)}</td>
              <td>
                <Link href={`/journeys/${journey.id}`} className="text-sm font-semibold text-coral">
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
