import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listTeamMembers } from "@/modules/team/repository";

import { TeamTable } from "@/components/profiles/team-table";

export const metadata: Metadata = {
  title: "Equipe",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  const authState = await requireRole("administrador");

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();
  const members = await listTeamMembers(regularClient, adminClient);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">Equipe</h1>
        <p className="text-sm text-ink-muted">
          Conceda ou revogue os papéis internos (Administrador, Curador Médico) de qualquer pessoa
          já cadastrada. Papéis de paciente e profissional continuam com fluxo próprio de criação.
        </p>
      </div>

      <TeamTable members={members} currentProfileId={authState.user.id} />
    </div>
  );
}
