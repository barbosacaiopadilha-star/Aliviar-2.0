import { PageHeader } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listContacts } from "@/modules/crm/repository";
import { CrmFunnelBoard } from "@/components/crm/crm-funnel-board";

export default async function CrmFunnelPage() {
  await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const contacts = await listContacts(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funil operacional"
        description="Visualize e mova contatos entre etapas. Use o seletor em cada cartão para mudar a etapa."
        breadcrumbs={[
          { label: "CRM", href: "/admin/crm" },
          { label: "Funil" },
        ]}
      />
      <CrmFunnelBoard contacts={contacts} />
    </div>
  );
}
