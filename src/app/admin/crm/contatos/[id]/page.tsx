import { notFound } from "next/navigation";

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
import { CrmContactDetailPanel } from "@/components/crm/crm-contact-detail-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CrmContactDetailPage({ params }: PageProps) {
  await requireAnyRole(["administrador", "concierge", "curador_medico"]);
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const contact = await getContactById(supabase, id);
  if (!contact) notFound();

  const [cases, interactions, tasks, appointments, timeline] = await Promise.all([
    listCasesForContact(supabase, id),
    listInteractionsForContact(supabase, id),
    listTasksForContact(supabase, id),
    listAppointmentsForContact(supabase, id),
    buildContactTimeline(supabase, id),
  ]);

  const activeCase = contact.activeCaseId ? await getCaseById(supabase, contact.activeCaseId) : null;
  const allowedStages = getAllowedStagesForContact(contact, activeCase, appointments);

  return (
    <CrmContactDetailPanel
      contact={contact}
      cases={cases}
      interactions={interactions}
      tasks={tasks}
      appointments={appointments}
      timeline={timeline}
      allowedStages={allowedStages}
    />
  );
}
