import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCases } from "@/modules/cases";

import { CasesTable } from "@/components/cases/cases-table";

export const metadata: Metadata = {
  title: "Meus casos",
  robots: { index: false, follow: false },
};

export default async function CuradorCasesPage() {
  await requireRole("curador_medico");

  const supabase = await createServerSupabaseClient();
  // RLS já restringe a listagem aos casos atribuídos a este curador.
  const cases = await listCases(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Meus casos</h1>
        <p className="text-sm text-ink-muted">Casos atribuídos a você.</p>
      </div>

      <CasesTable cases={cases} curators={[]} basePath="/curador/casos" />
    </div>
  );
}
