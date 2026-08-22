import Link from "next/link";

import { PageHeader } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listContacts } from "@/modules/crm/repository";
import { CrmContactsTable } from "@/components/crm/crm-contacts-table";

export const metadata = { title: "Contatos" };

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAnyRole(["administrador", "concierge"]);
  const params = await searchParams;
  const archived = params.status === "arquivados";
  const supabase = await createServerSupabaseClient();
  const contacts = await listContacts(supabase, {
    status: archived ? "arquivado" : "ativo",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description="Lista operacional de contatos e pessoas em acompanhamento."
        breadcrumbs={[
          { label: "CRM" },
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
      <nav aria-label="Estado dos contatos" className="flex flex-wrap gap-2">
        <Link
          href="/admin/crm/contatos"
          aria-current={!archived ? "page" : undefined}
          className={`rounded-md border px-3 py-2 text-sm font-medium ${!archived ? "border-brand-primary bg-brand-soft text-brand-primary" : "border-border bg-surface text-ink"}`}
        >
          Ativos
        </Link>
        <Link
          href="/admin/crm/contatos?status=arquivados"
          aria-current={archived ? "page" : undefined}
          className={`rounded-md border px-3 py-2 text-sm font-medium ${archived ? "border-brand-primary bg-brand-soft text-brand-primary" : "border-border bg-surface text-ink"}`}
        >
          Arquivados
        </Link>
      </nav>
      <CrmContactsTable contacts={contacts} />
    </div>
  );
}
