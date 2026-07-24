import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listAppointments } from "@/modules/crm/repository";
import { Card } from "@/components/ui/card";

export default async function CrmAgendaPage() {
  await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const appointments = await listAppointments(supabase);
  const now = new Date();

  const upcoming = appointments.filter((a) => a.status !== "cancelado" && new Date(a.startAt) >= now);
  const past = appointments.filter((a) => new Date(a.startAt) < now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Agenda operacional</h1>
        <p className="text-sm text-ink-muted">Compromissos futuros e histórico recente. Sincronização com Google Calendar ainda não implementada.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-sans text-lg font-semibold text-ink">Próximos</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum compromisso futuro.</p>
        ) : (
          upcoming.map((appointment) => (
            <Card key={appointment.id} padding="sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{appointment.title}</p>
                  <p className="text-sm text-ink-muted">
                    <Link href={`/admin/crm/contatos/${appointment.contactId}`} className="text-brand-primary">
                      {appointment.contactName}
                    </Link>
                    {" · "}
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(new Date(appointment.startAt))}
                  </p>
                </div>
                <p className="text-sm text-ink-muted">{appointment.assignedToName ?? "—"} · {appointment.status}</p>
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-lg font-semibold text-ink">Anteriores</h2>
        {past.slice(0, 20).map((appointment) => (
          <Card key={appointment.id} padding="sm">
            <p className="font-medium text-ink">{appointment.title}</p>
            <p className="text-sm text-ink-muted">{appointment.contactName} · {appointment.startAt}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
