import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getAceHealthCheck, getExecutionMetrics, listAllExecutionsOverview } from "@/modules/concierge";
import { listTeamMembers } from "@/modules/team/repository";

import { AceExecutionsTable } from "@/components/ace/ace-executions-table";
import { AceHealthCheckCard } from "@/components/ace/ace-health-check-card";
import { AceMetricsCards } from "@/components/ace/ace-metrics-cards";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Observabilidade do ACE",
  robots: { index: false, follow: false },
};

// Dashboard cross-caso, admin-only: o Curador Médico já enxerga tudo que
// precisa sobre seus próprios casos diretamente em /curador/casos/[id]
// (histórico de execuções + timeline, ambos scoped pela RLS); esta visão
// agregada de "todas as execuções da equipe" é uma ferramenta de operação
// que só faz sentido para quem já vê todos os Casos.
export default async function AdminAcePage() {
  await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  const [healthCheck, metrics, executions, members] = await Promise.all([
    getAceHealthCheck(regularClient),
    getExecutionMetrics(regularClient),
    listAllExecutionsOverview(regularClient),
    listTeamMembers(regularClient, adminClient),
  ]);

  const startersById = new Map(members.map((member) => [member.profileId, member.displayName]));
  const starterIds = Array.from(new Set(executions.map((execution) => execution.startedBy)));
  const starters = starterIds.map((id) => ({ id, name: startersById.get(id) ?? "Sem nome" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Observabilidade do ACE</h1>
        <p className="text-sm text-ink-muted">
          Visão operacional de todas as execuções do Método — nenhuma decisão nova é tomada aqui, só visibilidade.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Health Check do Método</h2>
        </CardHeader>
        <AceHealthCheckCard healthCheck={healthCheck} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Métricas</h2>
        </CardHeader>
        <AceMetricsCards metrics={metrics} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Histórico de execuções</h2>
        </CardHeader>
        <AceExecutionsTable executions={executions} curators={starters} />
      </Card>
    </div>
  );
}
