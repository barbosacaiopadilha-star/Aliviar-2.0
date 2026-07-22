import { describe, expect, it } from "vitest";

import { listDoctors } from "@/alicia/catalog";
import { EMPTY_FILTERS } from "@/alicia/types";

import {
  buildDiscoverySummary,
  buildEmptyStateSuggestion,
  clearFilterChip,
  getActiveFilterChips,
} from "./discovery-summary";

describe("discovery summary", () => {
  const doctors = listDoctors();

  it("builds removable chips for active filters", () => {
    const chips = getActiveFilterChips({
      ...EMPTY_FILTERS,
      specialty: "Ortopedia",
      city: "Vitória",
      radiusKm: 20,
    });

    expect(chips.map((chip) => chip.label)).toEqual(
      expect.arrayContaining(["Ortopedia", "Vitória", "Raio 20 km"]),
    );
  });

  it("clears a chip by key", () => {
    const next = clearFilterChip(
      { ...EMPTY_FILTERS, city: "Vitória", radiusKm: 20 },
      "radiusKm",
    );

    expect(next.radiusKm).toBeNull();
    expect(next.city).toBe("Vitória");
  });

  it("builds natural language summary", () => {
    const summary = buildDiscoverySummary(8, {
      ...EMPTY_FILTERS,
      specialty: "Ortopedia",
      city: "Vitória",
      residency: doctors[0]?.residency[0]?.institution ?? "",
    });

    expect(summary).toContain("Você está vendo:");
    expect(summary).toContain("ortopedistas");
    expect(summary).toContain("Vitória");
    expect(summary).toContain("residência");
  });

  it("suggests removing the most restrictive filter on empty results", () => {
    const suggestion = buildEmptyStateSuggestion(
      { ...EMPTY_FILTERS, radiusKm: 10, city: "Vitória" },
      doctors.length,
    );

    expect(suggestion.removeKey).toBe("radiusKm");
    expect(suggestion.message).not.toBe("Nenhum resultado.");
  });
});
