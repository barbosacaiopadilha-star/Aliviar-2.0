import type { Metadata } from "next";

import { getAuthState } from "@/modules/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listOwnProfessionalAnswers } from "@/modules/briefing/repository";
import { loadProtocolDraft } from "@/modules/curadoria/protocolos-repository";

import { DashboardPanel } from "@/components/shell/dashboard-panel";
import { ProfessionalDeclarations } from "@/components/profissional/professional-declarations";
import { ProtocoloPraticaForm } from "@/components/profissional/protocolo-pratica-form";

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

  // O Protocolo da Prática: o rascunho do próprio profissional (RLS de dono).
  // Sem perfil profissional vinculado, a seção simplesmente não aparece.
  let draft: Awaited<ReturnType<typeof loadProtocolDraft>> | null = null;
  const { data: ownProfile } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("profile_id", state?.user.id ?? "")
    .maybeSingle();
  if (ownProfile) {
    draft = await loadProtocolDraft(supabase, ownProfile.id as string);
  }

  return (
    <div className="space-y-8">
      <DashboardPanel displayName={displayName} roleLabel="profissional" />
      {draft ? (
        <ProtocoloPraticaForm initialResponses={draft.responses} lastSavedAt={draft.updatedAt} />
      ) : null}
      <ProfessionalDeclarations answers={answers} />
    </div>
  );
}
