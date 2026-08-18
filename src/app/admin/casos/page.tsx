import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCases } from "@/modules/cases";
import { listCuratorOptions } from "@/modules/team/repository";

import { CasesTable } from "@/components/cases/cases-table";

export const metadata: Metadata = {
  title: "Casos",
  robots: { index: false, follow: false },
};

export default async function AdminCasesPage() {
  await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();

  const [cases, curators] = await Promise.all([
    listCases(regularClient),
    listCuratorOptions(regularClient),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Casos</h1>
        <p className="text-sm text-ink-muted">
          Um caso nasce de uma história enviada — a história original nunca é
          alterada.
        </p>
      </div>

      <CasesTable cases={cases} curators={curators} basePath="/admin/casos" />
    </div>
  );
}
