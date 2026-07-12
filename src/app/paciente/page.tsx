import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { getPatientProfile, listPatientDocuments, listPatientNotifications } from "@/modules/profiles";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CurationStatusCard,
  InstitutionalMessages,
  NextStepsCard,
} from "@/components/profiles/patient-dashboard-sections";
import { PatientNotificationsList } from "@/components/profiles/patient-notifications-list";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Paciente",
  robots: { index: false, follow: false },
};

export default async function PacienteDashboardPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [profile, documents, notifications, caseOverview] = await Promise.all([
    getPatientProfile(supabase, authState.user.id),
    listPatientDocuments(supabase, authState.user.id),
    listPatientNotifications(supabase, authState.user.id),
    getPatientCaseOverview(supabase, authState.user.id),
  ]);

  const hasProfileData = Boolean(profile && (profile.phone || profile.city || profile.state));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">
          Olá, {authState.profile?.displayName ?? "Paciente"}
        </h1>
        <p className="text-sm text-ink-muted">Acompanhe sua jornada com a Aliviar por aqui.</p>
      </div>

      <CurationStatusCard caseStatusLabel={caseOverview?.statusLabel} />

      <div className="grid gap-6 lg:grid-cols-2">
        <NextStepsCard hasProfileData={hasProfileData} hasDocuments={documents.length > 0} />
        <InstitutionalMessages />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Notificações</h2>
        </CardHeader>

        {notifications.length === 0 ? (
          <EmptyState
            title="Nenhuma novidade por enquanto."
            description="Assim que houver algo novo — uma atualização da nossa equipe ou um passo na sua jornada — você verá aqui primeiro."
          />
        ) : (
          <PatientNotificationsList notifications={notifications.slice(0, 5)} />
        )}
      </Card>
    </div>
  );
}
