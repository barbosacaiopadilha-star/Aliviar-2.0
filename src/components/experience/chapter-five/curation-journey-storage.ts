import { calendarDaysBetween } from "./curation-time-model";

export const CURATION_STARTED_AT_KEY = "aliviar_curation_started_at";
export const CURATION_OPENING_SHOWN_KEY = "aliviar_curation_opening_shown";

export type CurationJourneyView =
  | { mode: "opening" }
  | { mode: "time"; daysSinceStart: number };

export function readCurationJourneyView(
  storage: Pick<Storage, "getItem" | "setItem">,
  now: Date = new Date(),
): CurationJourneyView {
  const openingShown = storage.getItem(CURATION_OPENING_SHOWN_KEY) === "true";
  const startedRaw = storage.getItem(CURATION_STARTED_AT_KEY);

  if (!openingShown) {
    const startedAt = startedRaw ?? now.toISOString();
    if (!startedRaw) {
      storage.setItem(CURATION_STARTED_AT_KEY, startedAt);
    }
    storage.setItem(CURATION_OPENING_SHOWN_KEY, "true");
    return { mode: "opening" };
  }

  const startedAt = new Date(startedRaw ?? now.toISOString());
  const daysSinceStart = calendarDaysBetween(startedAt, now);

  return { mode: "time", daysSinceStart };
}
