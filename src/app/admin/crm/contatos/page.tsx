import Link from "next/link";

import { PageHeader } from "@/components/ads";
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
      <PageHeader
        title="Contatos"
        description="Lista operacional de contatos e pessoas em acompanhamento."
        breadcrumbs={[
          { label: "CRM", href: "/admin/crm" },
          { label: "Contatos" },
        ]}
        primaryAction={
          <Link
            href="/admin/crm/contatos/novo"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Criar contato
          </Link>
        }
      />
      <CrmContactsTable contacts={contacts} />
    </div>
  );
}
