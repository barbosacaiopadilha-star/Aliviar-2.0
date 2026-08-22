import { notFound } from "next/navigation";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import {
  buildContactTimeline,
  getAllowedStagesForContact,
  getCaseById,
  getContactById,
  listAppointmentsForContact,
  listCasesForContact,
  listInteractionsForContact,
  listTasksForContact,
} from "@/modules/crm/repository";
import { listTeamMembers } from "@/modules/team/repository";
import { PageHeader } from "@/components/ads";
import { CrmContactDetailPanel } from "@/components/crm/crm-contact-detail-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Contato" };

export default async function CrmContactDetailPage({ params }: PageProps) {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const contact = await getContactById(supabase, id);
  if (!contact) notFound();

  const [cases, interactions, tasks, appointments, timeline, teamMembers] = await Promise.all([
    listCasesForContact(supabase, id),
    listInteractionsForContact(supabase, id),
    listTasksForContact(supabase, id),
    listAppointmentsForContact(supabase, id),
    buildContactTimeline(supabase, id),
    listTeamMembers(supabase, createAdminSupabaseClient()),
  ]);

  const curators = teamMembers
    .filter((member) => member.roles.includes("curador_medico"))
    .map((member) => ({ id: member.profileId, name: member.displayName }));
  const concierges = teamMembers
    .filter((member) => member.roles.includes("concierge") || member.roles.includes("administrador"))
    .map((member) => ({ id: member.profileId, name: member.displayName }));

  const activeCase = contact.activeCaseId ? await getCaseById(supabase, contact.activeCaseId) : null;
  const allowedStages = getAllowedStagesForContact(contact, activeCase, appointments, state.roles);

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.fullName}
        description="Ficha operacional do contato."
        breadcrumbs={[
          { label: "CRM" },
          { label: "Contatos", href: "/admin/crm/contatos" },
          { label: contact.fullName },
        ]}
      />
      <CrmContactDetailPanel
      contact={contact}
      cases={cases}
      interactions={interactions}
      tasks={tasks}
      appointments={appointments}
      timeline={timeline}
      allowedStages={allowedStages}
      curators={curators}
      concierges={concierges}
      isAdmin={state.roles.includes("administrador")}
    />
    </div>
  );
}
