import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthState } from "@/modules/auth/session";
import { findDuplicateLeads } from "@/modules/crm/lead";
import { getLead, listCurators, listLeadsForAtendente } from "@/modules/crm/lead-repository";

import { LeadWorkspace } from "@/components/crm/lead-workspace";

export const metadata = { title: "Ficha do contato" };

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
        ← Meus leads
      </Link>

      <h1 className="font-sans text-2xl font-semibold text-ink">{lead.fullName}</h1>

      <LeadWorkspace
        lead={lead}
        duplicates={duplicates}
        curators={curators}
        isAdmin={state?.roles.includes("administrador") ?? false}
      />
    </div>
  );
}
