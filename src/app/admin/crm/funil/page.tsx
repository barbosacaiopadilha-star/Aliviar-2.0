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
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Funil operacional</h1>
        <p className="text-sm text-ink-muted">Visualize e mova contatos entre etapas com validação de transição.</p>
      </div>
      <CrmFunnelBoard contacts={contacts} />
    </div>
  );
}
