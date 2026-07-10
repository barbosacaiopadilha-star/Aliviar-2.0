import Link from "next/link";
import type { Patient } from "@/lib/types/database";
import { displayPatientName } from "@/lib/types/database";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function PatientList({ patients }: { patients: Patient[] }) {
  if (patients.length === 0) {
    return (
      <EmptyState
        title="Nenhum paciente cadastrado"
        description="Comece cadastrando o primeiro paciente e sua Jornada inicial."
        action={
          <Link href="/patients/new" className="btn-primary">
            Novo paciente
          </Link>
        }
      />
    );
  }

  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cidade</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Cadastro</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="font-medium">{displayPatientName(patient)}</td>
              <td>{patient.city ?? "—"}</td>
              <td>{patient.health_plan ?? "—"}</td>
              <td>
                <StatusBadge status={patient.status} kind="patient" />
              </td>
              <td>{formatDate(patient.created_at)}</td>
              <td>
                <Link href={`/patients/${patient.id}`} className="text-sm font-semibold text-coral">
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
