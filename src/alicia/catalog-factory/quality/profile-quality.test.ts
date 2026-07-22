import { describe, expect, it } from "vitest";

import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import { computeProfileQuality, isProfileComplete } from "./profile-quality";

const baseRecord: DoctorImportRecord = {
  id: "sample",
  name: "Dr. Sample",
  specialty: "Ortopedia",
  location: { lat: 0, lng: 0, city: "Vitória", state: "ES" },
  mainInstitution: "Hospital",
  whoTheyAre: "Ortopedista na Grande Vitória.",
  trajectory: "Formação em Medicina.",
  graduation: {
    institution: "Universidade Federal do Espírito Santo (UFES)",
    program: "Medicina",
    verified: true,
  },
  residency: [{ institution: "HMMC", program: "Ortopedia", verified: true }],
  fellowships: [],
  practiceAreas: ["Cirurgia do joelho"],
  institutions: [{ name: "Hospital", role: "Ortopedista", city: "Vitória" }],
  scientificProductionPlaceholder: "Placeholder",
  transparency: {
    lastUpdated: "2026-07-22",
    sources: [
      { name: "CRM-ES 1.234", type: "Registro profissional" },
      { name: "Site", type: "Instituição" },
    ],
    unverifiedFields: [],
  },
};

describe("profile quality", () => {
  it("computes internal quality indicators", () => {
    const quality = computeProfileQuality(baseRecord, "2026-07-22");

    expect(quality.coverage).toBeGreaterThan(0);
    expect(quality.reliability).toBeGreaterThan(0);
    expect(quality.freshness).toBe(100);
    expect(quality.sourceCount).toBe(2);
    expect(quality.overall).toBeGreaterThan(0);
  });

  it("marks incomplete profiles with pending fields", () => {
    const quality = computeProfileQuality(
      {
        ...baseRecord,
        transparency: {
          ...baseRecord.transparency,
          unverifiedFields: ["Graduação", "Residência", "CRM"],
        },
      },
      "2026-07-22",
    );

    expect(quality.pendingFieldCount).toBe(3);
    expect(isProfileComplete(quality)).toBe(false);
  });
});
