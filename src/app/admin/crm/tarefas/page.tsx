import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { listTasks } from "@/modules/crm/repository";
import { CrmTasksPanel } from "@/components/crm/crm-tasks-panel";

export default async function CrmTasksPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const tasks = await listTasks(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Tarefas</h1>
        <p className="text-sm text-ink-muted">Próximas ações, retornos e acompanhamentos da equipe.</p>
      </div>
      <CrmTasksPanel tasks={tasks} currentUserId={state.user.id} isAdmin={state.roles.includes("administrador")} />
    </div>
  );
}
