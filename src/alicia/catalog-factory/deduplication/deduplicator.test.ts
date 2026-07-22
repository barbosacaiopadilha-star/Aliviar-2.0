import { describe, expect, it } from "vitest";

import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import { deduplicateImportRecords, findDuplicateCandidates } from "./deduplicator";

function createDoctor(id: string, name: string, crm: string): DoctorImportRecord {
  return {
    id,
    name,
    specialty: "Ortopedia",
    location: { lat: 0, lng: 0, city: "Vitória", state: "ES" },
    mainInstitution: "Hospital",
    whoTheyAre: "Ortopedista.",
    trajectory: "Trajetória.",
    graduation: { institution: "UFES", program: "Medicina", verified: true },
    residency: [],
    fellowships: [],
    practiceAreas: [],
    institutions: [],
    scientificProductionPlaceholder: "Placeholder",
    transparency: {
      lastUpdated: "2026-07-22",
      sources: [{ name: crm, type: "Registro profissional" }],
      unverifiedFields: [],
    },
  };
}

describe("deduplicator", () => {
  it("finds duplicate candidates by CRM", () => {
    const duplicates = findDuplicateCandidates([
      createDoctor("a", "Dr. João A", "CRM-ES 11.111"),
      createDoctor("b", "Dr. João B", "CRM-ES 11.111"),
    ]);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.score).toBeGreaterThanOrEqual(100);
  });

  it("removes exact CRM duplicates during deduplication", () => {
    const result = deduplicateImportRecords([
      createDoctor("a", "Dr. João A", "CRM-ES 11.111"),
      createDoctor("b", "Dr. João B", "CRM-ES 11.111"),
    ]);

    expect(result.records).toHaveLength(1);
    expect(result.removedDoctorIds).toEqual(["b"]);
  });
});
