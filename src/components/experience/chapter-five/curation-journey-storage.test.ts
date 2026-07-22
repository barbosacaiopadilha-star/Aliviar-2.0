import { describe, expect, it } from "vitest";

import {
  CURATION_OPENING_SHOWN_KEY,
  CURATION_STARTED_AT_KEY,
  readCurationJourneyView,
} from "./curation-journey-storage";

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("curation-journey-storage", () => {
  it("mostra abertura na primeira visita e registra o início", () => {
    const storage = createMemoryStorage();
    const now = new Date("2026-07-22T15:00:00");

    expect(readCurationJourneyView(storage, now)).toEqual({ mode: "opening" });
    expect(storage.getItem(CURATION_STARTED_AT_KEY)).toBe(now.toISOString());
    expect(storage.getItem(CURATION_OPENING_SHOWN_KEY)).toBe("true");
  });

  it("na volta no mesmo dia, entra no modo tempo sem repetir a abertura", () => {
    const storage = createMemoryStorage({
      [CURATION_STARTED_AT_KEY]: "2026-07-22T10:00:00",
      [CURATION_OPENING_SHOWN_KEY]: "true",
    });

    expect(readCurationJourneyView(storage, new Date("2026-07-22T20:00:00"))).toEqual({
      mode: "time",
      daysSinceStart: 0,
    });
  });

  it("evolui a experiência após dias calendário", () => {
    const storage = createMemoryStorage({
      [CURATION_STARTED_AT_KEY]: "2026-07-15T10:00:00",
      [CURATION_OPENING_SHOWN_KEY]: "true",
    });

    expect(readCurationJourneyView(storage, new Date("2026-07-22T10:00:00"))).toEqual({
      mode: "time",
      daysSinceStart: 7,
    });
  });
});
