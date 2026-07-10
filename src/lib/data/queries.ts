import { createClient } from "@/lib/supabase/server";
import type { Journey, JourneyWithRelations, Patient, Profile } from "@/lib/types/database";
import { isOpenJourneyStatus } from "@/lib/types/database";

export async function listPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Patient[];
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .maybeSingle();

  if (error) throw error;
  return (data as Patient | null) ?? null;
}

export async function listJourneysForPatient(patientId: string): Promise<Journey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("patient_id", patientId)
    .order("opened_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Journey[];
}

export async function listJourneys(): Promise<JourneyWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select(`
      *,
      patient:patients(id, full_name, preferred_name),
      manager:profiles!journeys_manager_id_fkey(id, full_name, role)
    `)
    .order("opened_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as JourneyWithRelations[];
}

export async function getJourneyById(journeyId: string): Promise<JourneyWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select(`
      *,
      patient:patients(id, full_name, preferred_name),
      manager:profiles!journeys_manager_id_fkey(id, full_name, role)
    `)
    .eq("id", journeyId)
    .maybeSingle();

  if (error) throw error;
  return (data as JourneyWithRelations | null) ?? null;
}

export async function listActiveManagers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .in("role", ["ADMIN", "MANAGER"])
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function countActivePatients(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  if (error) throw error;
  return count ?? 0;
}

export async function countOpenJourneys(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").select("status");

  if (error) throw error;
  return (data ?? []).filter((journey) => isOpenJourneyStatus(journey.status)).length;
}

export async function listRecentJourneys(limit = 5): Promise<JourneyWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select(`
      *,
      patient:patients(id, full_name, preferred_name),
      manager:profiles!journeys_manager_id_fkey(id, full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as JourneyWithRelations[];
}
