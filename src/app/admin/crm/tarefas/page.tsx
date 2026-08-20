import { PageHeader } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listTasks } from "@/modules/crm/repository";
import { CrmTasksPanel } from "@/components/crm/crm-tasks-panel";

export const metadata = { title: "Tarefas" };

export default async function CrmTasksPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const tasks = await listTasks(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Próximas ações, retornos e acompanhamentos da equipe."
        breadcrumbs={[
          { label: "CRM", href: "/admin/crm" },
          { label: "Tarefas" },
        ]}
      />
      <CrmTasksPanel tasks={tasks} currentUserId={state.user.id} isAdmin={state.roles.includes("administrador")} />
    </div>
  );
}
