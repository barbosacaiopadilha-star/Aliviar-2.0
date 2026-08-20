import Link from "next/link";

import { DashboardSection, PageHeader } from "@/components/ads";
import { Card } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listAppointments } from "@/modules/crm/repository";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(new Date(iso));
}

export const metadata = { title: "Agenda operacional" };

export default async function CrmAgendaPage() {
  await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const appointments = await listAppointments(supabase);
  const now = new Date();

  const upcoming = appointments.filter((a) => a.status !== "cancelado" && new Date(a.startAt) >= now);
  const past = appointments.filter((a) => new Date(a.startAt) < now);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda operacional"
        description="Compromissos futuros e histórico recente."
        breadcrumbs={[
          { label: "CRM", href: "/admin/crm" },
          { label: "Agenda" },
        ]}
      />

      <DashboardSection
        title="Próximos compromissos"
        isEmpty={upcoming.length === 0}
        emptyTitle="Nenhum compromisso futuro."
        emptyDescription="Agende retornos ou consultas a partir da ficha do contato."
      >
        <div className="space-y-3">
          {upcoming.map((appointment) => (
            <Card key={appointment.id} padding="sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{appointment.title}</p>
                  <p className="text-sm text-ink-muted">
                    <Link href={`/admin/crm/contatos/${appointment.contactId}`} className="text-brand-primary hover:text-brand-primary-deep">
                      {appointment.contactName}
                    </Link>
                    {" · "}
                    {formatDateTime(appointment.startAt)}
                  </p>
                </div>
                <p className="text-sm text-ink-muted">{appointment.assignedToName ?? "—"} · {appointment.status}</p>
              </div>
            </Card>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Anteriores" isEmpty={past.length === 0} emptyTitle="Nenhum compromisso anterior.">
        <div className="space-y-3">
          {past.slice(0, 20).map((appointment) => (
            <Card key={appointment.id} padding="sm">
              <p className="font-medium text-ink">{appointment.title}</p>
              <p className="text-sm text-ink-muted">
                {appointment.contactName} · {formatDateTime(appointment.startAt)}
              </p>
            </Card>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
