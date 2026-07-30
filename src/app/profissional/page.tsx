import type { Metadata } from "next";

import { getAuthState } from "@/modules/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOwnProfessionalAnswers } from "@/modules/briefing/repository";

import { DashboardPanel } from "@/components/shell/dashboard-panel";
import { ProfessionalDeclarations } from "@/components/profissional/professional-declarations";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Profissional",
  robots: { index: false, follow: false },
};

export default async function ProfissionalDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Profissional";

  // As declarações do próprio profissional. A RLS restringe a linha a
  // auth.uid() — este portal não tem caminho para ler as de outra pessoa.
  const supabase = await createServerSupabaseClient();
  const answers = await listOwnProfessionalAnswers(supabase);

  return (
    <div className="space-y-8">
      <DashboardPanel displayName={displayName} roleLabel="profissional" />
      <ProfessionalDeclarations answers={answers} />
    </div>
  );
}
