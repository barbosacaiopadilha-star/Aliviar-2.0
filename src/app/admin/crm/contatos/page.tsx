import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listContacts } from "@/modules/crm/repository";
import { CrmContactsTable } from "@/components/crm/crm-contacts-table";

export default async function CrmContactsPage() {
  await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const contacts = await listContacts(supabase);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">Contatos</h1>
          <p className="text-sm text-ink-muted">Lista operacional de contatos e pacientes em acompanhamento.</p>
        </div>
        <Link
          href="/admin/crm/contatos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface hover:bg-brand-primary-deep"
        >
          Novo contato
        </Link>
      </div>
      <CrmContactsTable contacts={contacts} />
    </div>
  );
}
