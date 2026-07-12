import type { Metadata } from "next";

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
    <PatientProfileForm
      initialPhone={profile?.phone ?? ""}
      initialCity={profile?.city ?? ""}
      initialState={profile?.state ?? ""}
      initialPreferredChannel={preferences.preferredChannel}
      initialAcceptsReminders={preferences.acceptsReminders}
    />
  );
}
