import { createClient } from "@/lib/supabase/server";
import type { JourneyEventWithAuthor } from "@/modules/journey-events/types/journey-event";

export async function listJourneyEvents(
  journeyId: string,
  category?: string,
): Promise<JourneyEventWithAuthor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("journey_events")
    .select(`
      *,
      author:profiles!journey_events_created_by_fkey(id, full_name)
    `)
    .eq("journey_id", journeyId)
    .order("occurred_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;

  const events = (data ?? []) as JourneyEventWithAuthor[];

  const correctedIds = events
    .filter((e) => e.corrected_event_id)
    .map((e) => e.corrected_event_id as string);

  if (correctedIds.length === 0) return events;

  const { data: originals } = await supabase
    .from("journey_events")
    .select("id, title, occurred_at")
    .in("id", correctedIds);

  const originalMap = new Map((originals ?? []).map((o) => [o.id, o]));

  return events.map((event) => ({
    ...event,
    corrected_original: event.corrected_event_id
      ? originalMap.get(event.corrected_event_id) ?? null
      : null,
  }));
}

export async function getLatestNextStep(journeyId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journey_events")
    .select("next_step, occurred_at")
    .eq("journey_id", journeyId)
    .not("next_step", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.next_step?.trim() || null;
}

export async function getJourneyEventById(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_events")
    .select(`
      *,
      author:profiles!journey_events_created_by_fkey(id, full_name)
    `)
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  return data as JourneyEventWithAuthor | null;
}
