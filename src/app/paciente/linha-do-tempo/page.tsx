import { CalendarCheck, FileText, Sparkles, UserCheck } from "lucide-react";
import type { ComponentType } from "react";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientProfile, listPatientDocuments, listPatientNotifications } from "@/modules/profiles";

import { Card, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Linha do tempo",
  robots: { index: false, follow: false },
};

type TimelineEvent = {
  key: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  date: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

export default async function PatientTimelinePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [{ data: profileRow }, patientProfile, documents, notifications] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", authState.user.id).single(),
    getPatientProfile(supabase, authState.user.id),
    listPatientDocuments(supabase, authState.user.id),
    listPatientNotifications(supabase, authState.user.id),
  ]);

  const events: TimelineEvent[] = [];

  if (profileRow?.created_at) {
    events.push({
      key: "conta-criada",
      icon: UserCheck,
      label: "Sua conta na Aliviar foi criada",
      date: profileRow.created_at as string,
    });
  }

  if (patientProfile) {
    events.push({
      key: "perfil-preenchido",
      icon: CalendarCheck,
      label: "Você preencheu seus dados de perfil",
      date: patientProfile.createdAt,
    });
  }

  for (const document of documents) {
    events.push({
      key: `documento-${document.id}`,
      icon: FileText,
      label: `Você enviou o documento "${document.fileName}"`,
      date: document.createdAt,
    });
  }

  for (const notification of notifications) {
    events.push({
      key: `notificacao-${notification.id}`,
      icon: Sparkles,
      label: notification.title,
      date: notification.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Linha do tempo</h1>
        <p className="text-sm text-ink-muted">Tudo que já aconteceu na sua jornada com a Aliviar, até aqui.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Sua jornada</h2>
        </CardHeader>

        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-sage-light/40 text-brand-primary-deep"
              >
                <event.icon className="size-4" aria-hidden={true} />
              </span>
              <div>
                <p className="text-sm text-ink">{event.label}</p>
                <p className="text-xs text-ink-muted">{formatDate(event.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
