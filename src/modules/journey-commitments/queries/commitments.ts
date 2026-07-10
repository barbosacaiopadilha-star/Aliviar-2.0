import { createClient } from "@/lib/supabase/server";
import type { JourneyWithRelations } from "@/lib/types/database";
import type { Profile } from "@/lib/types/database";
import type { JourneyCommitmentWithAssignee } from "@/modules/journey-commitments/types/commitment";
import { OPEN_COMMITMENT_STATUSES } from "@/modules/journey-commitments/types/commitment";

export async function listJourneyCommitments(
  journeyId: string,
): Promise<JourneyCommitmentWithAssignee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_commitments")
    .select(`
      *,
      assignee:profiles!journey_commitments_assigned_to_fkey(id, full_name)
    `)
    .eq("journey_id", journeyId);

  if (error) throw error;
  return (data ?? []) as JourneyCommitmentWithAssignee[];
}

export async function getCommitmentById(commitmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_commitments")
    .select("*")
    .eq("id", commitmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listActiveStaff(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listJourneysWithoutOpenCommitments(): Promise<JourneyWithRelations[]> {
  const supabase = await createClient();

  const { data: journeys, error: journeysError } = await supabase
    .from("journeys")
    .select(`
      *,
      patient:patients(id, full_name, preferred_name),
      manager:profiles!journeys_manager_id_fkey(id, full_name, role)
    `)
    .in("status", ["NEW", "ACTIVE", "WAITING"])
    .order("opened_at", { ascending: false });

  if (journeysError) throw journeysError;

  const { data: openCommitments, error: commitmentsError } = await supabase
    .from("journey_commitments")
    .select("journey_id")
    .in("status", OPEN_COMMITMENT_STATUSES);

  if (commitmentsError) throw commitmentsError;

  const journeyIdsWithOpen = new Set(
    (openCommitments ?? []).map((c) => c.journey_id),
  );

  return ((journeys ?? []) as JourneyWithRelations[]).filter(
    (j) => !journeyIdsWithOpen.has(j.id),
  );
}

export async function journeyAcceptsCommitments(journeyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("status")
    .eq("id", journeyId)
    .maybeSingle();

  if (error || !data) return false;
  return data.status !== "FINISHED" && data.status !== "CANCELLED";
}
