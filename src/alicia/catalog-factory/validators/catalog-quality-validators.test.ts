import { describe, expect, it } from "vitest";

import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import {
  hasBlockingValidationIssues,
  validateCatalogQualityRules,
  validateDoctorQualityRules,
} from "./catalog-quality-validators";

const doctor: DoctorImportRecord = {
  id: "doctor-a",
  name: "Dr. A",
  specialty: "Ortopedia",
  location: { lat: 0, lng: 0, city: "Vitória", state: "ES" },
  mainInstitution: "Hospital A",
  whoTheyAre: "Ortopedista.",
  trajectory: "Trajetória.",
  graduation: {
    institution: "UFES",
    program: "Medicina",
    period: "2010–2015",
    verified: true,
  },
  residency: [],
  fellowships: [],
  practiceAreas: ["Joelho"],
  institutions: [{ name: "Hospital A", role: "Ortopedista", city: "Vitória" }],
  scientificProductionPlaceholder: "Placeholder",
  transparency: {
    lastUpdated: "2026-07-22",
    sources: [{ name: "CRM-ES 1.111", type: "Registro profissional" }],
    unverifiedFields: [],
  },
};

describe("catalog quality validators", () => {
  it("flags impossible periods as blocking", () => {
    const issues = validateDoctorQualityRules({
      ...doctor,
      graduation: {
        ...doctor.graduation,
        period: "2020–2010",
      },
    });

    expect(hasBlockingValidationIssues(issues)).toBe(true);
    expect(issues.some((issue) => issue.code === "date.impossible_period")).toBe(true);
  });

  it("flags duplicate doctor names", () => {
    const issues = validateCatalogQualityRules([
      doctor,
      { ...doctor, id: "doctor-b", name: "Dr. A" },
    ]);

    expect(issues.some((issue) => issue.code === "doctor.duplicate_name")).toBe(true);
  });

  it("queues pending fields for review", () => {
    const issues = validateDoctorQualityRules({
      ...doctor,
      transparency: {
        ...doctor.transparency,
        unverifiedFields: ["Graduação"],
      },
    });

    expect(issues.some((issue) => issue.code === "field.pending_verification")).toBe(true);
  });
});
