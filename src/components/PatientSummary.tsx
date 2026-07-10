import type { Patient } from "@/lib/types/database";
import { displayPatientName } from "@/lib/types/database";
import { StatusBadge } from "@/components/StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function PatientSummary({ patient }: { patient: Patient }) {
  return (
    <div className="card grid gap-4 p-6 md:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Nome completo</p>
        <p className="mt-1 font-medium">{patient.full_name}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Nome de acolhimento</p>
        <p className="mt-1 font-medium">{patient.preferred_name ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Nome exibido</p>
        <p className="mt-1 font-medium">{displayPatientName(patient)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Status</p>
        <div className="mt-1">
          <StatusBadge status={patient.status} kind="patient" />
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Nascimento</p>
        <p className="mt-1">{formatDate(patient.birth_date)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">CPF</p>
        <p className="mt-1">{patient.cpf ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Telefone</p>
        <p className="mt-1">{patient.phone ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">E-mail</p>
        <p className="mt-1">{patient.email ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Cidade / UF</p>
        <p className="mt-1">
          {patient.city ?? "—"}
          {patient.state ? ` / ${patient.state}` : ""}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Plano de saúde</p>
        <p className="mt-1">{patient.health_plan ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-soft">Cadastrado em</p>
        <p className="mt-1">{formatDate(patient.created_at)}</p>
      </div>
    </div>
  );
}
