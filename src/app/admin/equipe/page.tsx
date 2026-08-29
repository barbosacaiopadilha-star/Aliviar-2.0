import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listRecentAuditLogs, listTeamMembers } from "@/modules/team/repository";

import { AuditLogList } from "@/components/admin/audit-log-list";
import { Card, CardHeader } from "@/components/ui/card";
import { TeamTable } from "@/components/profiles/team-table";

export const metadata: Metadata = {
  title: "Equipe",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  const authState = await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();
  const [members, recentActivity] = await Promise.all([
    listTeamMembers(regularClient, adminClient),
    listRecentAuditLogs(regularClient, 8),
  ]);

  // 24/08 (auditoria do Fundador) · "Pessoas por papel" e a "Atividade
  // recente" MUDARAM DE CASA: viviam na Visão geral, que virou a tela do
  // "o que precisa de alguém agora?" — e papéis são assunto desta página,
  // que é onde eles se concedem. Papéis contados por PESSOA, não por
  // concessão: quem acumula aparece nos dois, e é isso que o Administrador
  // precisa enxergar para corrigir.
  const porPapel = (["atendente", "curador_medico", "concierge", "administrador"] as const).map((slug) => ({
    slug,
    label: { atendente: "Supervisor", curador_medico: "Curador", concierge: "Concierge", administrador: "Administrador" }[
      slug
    ],
    count: members.filter((m) => m.roles.includes(slug)).length,
  }));
  const acumulamNiveis = members.filter(
    (m) => ["atendente", "curador_medico", "concierge"].filter((r) => m.roles.includes(r)).length > 1,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Equipe</h1>
        <p className="text-sm text-ink-muted">
          Conceda ou revogue os papéis internos (Administrador, Curador Médico, Supervisor, Concierge) de qualquer pessoa
          já cadastrada. Papéis de assistido e profissional continuam com fluxo próprio de criação.
        </p>
      </div>

      <TeamTable members={members} currentProfileId={authState.user.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-border bg-surface p-4" aria-labelledby="papeis-titulo">
          <h2 id="papeis-titulo" className="text-sm font-semibold text-ink">
            Pessoas por papel
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">A operação tem gente em cada nível?</p>

          <ul className="mt-3 space-y-1.5">
            {porPapel.map((papel) => (
              <li key={papel.slug} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">{papel.label}</span>
                <span className={`tabular-nums ${papel.count === 0 ? "text-brand-gold" : "text-ink"}`}>{papel.count}</span>
              </li>
            ))}
          </ul>

          {acumulamNiveis.length > 0 ? (
            <p className="mt-3 rounded-md border border-warning bg-warning-surface px-3 py-2 text-xs text-ink">
              {acumulamNiveis.length === 1 ? "Uma pessoa acumula" : `${acumulamNiveis.length} pessoas acumulam`} mais de
              um nível operacional. Desde a ADR-100 o Supervisor acompanha o Case por todos os níveis de propósito — não
              é disso que este aviso trata. O que ele acusa é a mesma pessoa EXECUTANDO níveis que nenhuma decisão
              unificou: enquanto durar, o isolamento por papel existe no sistema e não se exercita na prática.
            </p>
          ) : null}
        </section>

        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Atividade recente</h2>
            <p className="text-sm text-ink-muted">Últimas concessões e revogações de papel.</p>
          </CardHeader>

          <AuditLogList entries={recentActivity} emptyMessage="Ainda não há atividade registrada." showTarget />
        </Card>
      </div>
    </div>
  );
}
