import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCases } from "@/modules/cases";
import { listTeamMembers } from "@/modules/team/repository";

import { CasesTable } from "@/components/cases/cases-table";

export const metadata: Metadata = {
  title: "Casos",
  robots: { index: false, follow: false },
};

export default async function AdminCasesPage() {
  await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  const [cases, members] = await Promise.all([
    listCases(regularClient),
    listTeamMembers(regularClient, adminClient),
  ]);

  const curators = members
    .filter((member) => member.roles.includes("curador_medico"))
    .map((member) => ({ id: member.profileId, name: member.displayName }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Casos</h1>
        <p className="text-sm text-ink-muted">
          Um caso nasce de uma história enviada — a história original nunca é alterada.
        </p>
      </div>

      <CasesTable cases={cases} curators={curators} basePath="/admin/casos" />
    </div>
  );
}
