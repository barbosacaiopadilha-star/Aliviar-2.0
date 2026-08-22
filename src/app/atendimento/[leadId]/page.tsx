import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthState } from "@/modules/auth/session";
import { findDuplicateLeads } from "@/modules/crm/lead";
import { getLead, listCurators, listLeadsForAtendente } from "@/modules/crm/lead-repository";
import {
  buildContactTimeline,
  listAppointmentsForContact,
  listTasksForContact,
} from "@/modules/crm/repository";

import { ContactRegistro } from "@/components/crm/contact-registro";
import { LeadWorkspace } from "@/components/crm/lead-workspace";

export const metadata = { title: "Ficha do contato" };

/**
 * A FICHA ÚNICA do contato — fusão fila×contatos (21/08). A mesma pessoa
 * tinha duas fichas: esta (a jornada — qualificar, converter, abrir o Case,
 * encaminhar) e a do CRM (o registro — interações, tarefas, agenda, linha do
 * tempo). A do CRM virou redirecionamento para cá, e o registro dela passou
 * a viver abaixo da jornada. Uma pessoa, uma ficha.
 */
export default async function LeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const supabase = await createServerSupabaseClient();

  const [lead, todos, curators, state] = await Promise.all([
    getLead(supabase, leadId),
    listLeadsForAtendente(supabase),
    listCurators(supabase),
    getAuthState(),
  ]);

  if (!lead) notFound();

  const [tasks, appointments, timeline] = await Promise.all([
    listTasksForContact(supabase, leadId),
    listAppointmentsForContact(supabase, leadId),
    buildContactTimeline(supabase, leadId),
  ]);

  // Duplicidade calculada no servidor, contra os leads que este usuário pode
  // ver. Se a RLS esconde um contato dele, ele não descobre que existe por
  // meio de um aviso de duplicidade.
  const duplicates = findDuplicateLeads(
    { phone: lead.phoneNormalized, email: lead.emailNormalized, fullName: lead.fullName },
    todos.filter((outro) => outro.id !== lead.id),
  );

  return (
    <div className="space-y-4">
      <Link
        href="/atendimento"
        className="inline-flex min-h-11 items-center text-sm text-ink-muted underline-offset-4 hover:underline"
      >
        ← Quem chegou
      </Link>

      <h1 className="font-sans text-2xl font-semibold text-ink">{lead.fullName}</h1>

      <LeadWorkspace
        lead={lead}
        duplicates={duplicates}
        curators={curators}
        isAdmin={state?.roles.includes("administrador") ?? false}
      />

      <ContactRegistro
        contactId={lead.id}
        caseId={lead.activeCaseId ?? lead.caseId}
        tasks={tasks}
        appointments={appointments}
        timeline={timeline}
      />
    </div>
  );
}
