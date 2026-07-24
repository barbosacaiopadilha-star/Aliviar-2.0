import Link from "next/link";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listPatientAccounts, listProfessionalProfiles } from "@/modules/profiles";
import { listRecentAuditLogs, listTeamMembers } from "@/modules/team/repository";

import { AuditLogList } from "@/components/admin/audit-log-list";

export const metadata: Metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

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
    <DashboardLayout
      title={`Olá, ${state.profile?.displayName ?? "Administrador"}`}
      description="Visão geral da operação da Aliviar."
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Visão geral" }]}
      primaryAction={
        <Link
          href="/admin/crm/contatos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Criar contato
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pacientes ativos" value={activePatients} href="/admin/pacientes" />
          <KpiCard label="Profissionais ativos" value={activeProfessionals} href="/admin/profissionais" />
          <KpiCard label="Administradores" value={administradores} href="/admin/equipe" />
          <KpiCard label="Curadores médicos" value={curadores} href="/admin/equipe" />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
          <DashboardSection
            title="Pendências"
            description="Profissionais ativos aguardando decisão de publicação."
            isEmpty={pendingPublication.length === 0}
            emptyTitle="Nenhuma pendência no momento."
            emptyDescription="Todos os profissionais ativos já têm uma decisão de publicação registrada."
          >
            <DashboardList
              items={pendingPublication.map((professional) => ({
                id: professional.id,
                label: professional.displayName,
                meta: "Revisar",
                href: `/admin/profissionais/${professional.id}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Atividade recente"
            description="Últimas concessões e revogações de papel."
            isEmpty={recentActivity.length === 0}
            emptyTitle="Ainda não há atividade registrada."
          >
            <AuditLogList entries={recentActivity} emptyMessage="" showTarget />
          </DashboardSection>
        </div>
    </DashboardLayout>
  );
}
