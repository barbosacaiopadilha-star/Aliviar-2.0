import type { Metadata } from "next";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getCommunicationPreferences, getPatientProfile } from "@/modules/profiles";

import { PatientProfileForm } from "@/components/profiles/patient-profile-form";

export const metadata: Metadata = {
  title: "Meu perfil",
  robots: { index: false, follow: false },
};

export default async function PatientProfilePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [profile, preferences] = await Promise.all([
    getPatientProfile(supabase, authState.user.id),
    getCommunicationPreferences(supabase, authState.user.id),
  ]);

  return (
    <div className="space-y-10">
      <PatientProfileForm
        initialPhone={profile?.phone ?? ""}
        initialCity={profile?.city ?? ""}
        initialState={profile?.state ?? ""}
        initialPreferredChannel={preferences.preferredChannel}
        initialAcceptsReminders={preferences.acceptsReminders}
      />

      {/* C6 · Track C — corrigir um dado próprio é um dos motivos mais comuns
          de querer falar com alguém. A porta fica no fim, fora do formulário:
          nunca disputa com o botão de salvar. */}
      <ConciergeLink topic="jornada" />
    </div>
  );
}
