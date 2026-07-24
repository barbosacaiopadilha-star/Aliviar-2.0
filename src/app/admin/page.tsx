import Link from "next/link";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listPatientAccounts, listProfessionalProfiles } from "@/modules/profiles";
import { listRecentAuditLogs, listTeamMembers } from "@/modules/team/repository";

import { AuditLogList } from "@/components/admin/audit-log-list";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <Card padding="lg" className="h-full">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-brand-primary-deep">{value}</p>
    </Card>
  );

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function AdminDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  if (!state.roles.includes("administrador")) {
    redirect("/admin/crm");
  }

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  const [patients, professionals, teamMembers, recentActivity] = await Promise.all([
    listPatientAccounts(regularClient, adminClient),
    listProfessionalProfiles(regularClient),
    listTeamMembers(regularClient, adminClient),
    listRecentAuditLogs(regularClient, 8),
  ]);

  const activePatients = patients.filter((patient) => patient.accountStatus === "ativo").length;
  const activeProfessionals = professionals.filter((professional) => professional.status === "ativo").length;
  const administradores = teamMembers.filter((member) => member.roles.includes("administrador")).length;
  const curadores = teamMembers.filter((member) => member.roles.includes("curador_medico")).length;

  const pendingPublication = professionals.filter(
    (professional) => professional.status === "ativo" && professional.publicationStatus === "nao_publicado",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">
          Olá, {state.profile?.displayName ?? "Administrador"}
        </h1>
        <p className="text-sm text-ink-muted">Visão geral da operação da Aliviar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes ativos" value={activePatients} href="/admin/pacientes" />
        <StatCard label="Profissionais ativos" value={activeProfessionals} href="/admin/profissionais" />
        <StatCard label="Administradores" value={administradores} href="/admin/equipe" />
        <StatCard label="Curadores médicos" value={curadores} href="/admin/equipe" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Pendências</h2>
            <p className="text-sm text-ink-muted">Profissionais ativos aguardando decisão de publicação.</p>
          </CardHeader>

          {pendingPublication.length === 0 ? (
            <EmptyState
              title="Nenhuma pendência no momento."
              description="Todos os profissionais ativos já têm uma decisão de publicação registrada."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pendingPublication.map((professional) => (
                <li key={professional.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-ink">{professional.displayName}</span>
                  <Link
                    href={`/admin/profissionais/${professional.id}`}
                    className="font-medium text-brand-primary hover:text-brand-primary-deep"
                  >
                    Revisar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Atividade recente</h2>
            <p className="text-sm text-ink-muted">Últimas concessões e revogações de papel.</p>
          </CardHeader>

          <AuditLogList
            entries={recentActivity}
            emptyMessage="Ainda não há atividade registrada."
            showTarget
          />
        </Card>
      </div>
    </div>
  );
}
