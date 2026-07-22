import { describe, expect, it } from "vitest";

import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";
import {
  CatalogValidationError,
  validateCatalogImportPayload,
  validateDoctorImportRecord,
} from "@/alicia/infrastructure/import/validator";

const validDoctor: DoctorImportRecord = {
  id: "test-doctor",
  name: "Dra. Teste",
  specialty: "Cardiologia",
  location: { lat: -23.5, lng: -46.6, city: "São Paulo", state: "SP" },
  mainInstitution: "Hospital Teste",
  whoTheyAre: "Médica de teste.",
  trajectory: "Trajetória de teste.",
  graduation: {
    institution: "Universidade Teste",
    program: "Medicina",
    period: "2000–2005",
    verified: true,
  },
  residency: [],
  fellowships: [],
  practiceAreas: ["Teste"],
  institutions: [{ name: "Hospital Teste", role: "Médica", city: "São Paulo" }],
  scientificProductionPlaceholder: "Placeholder",
  transparency: {
    lastUpdated: "2026-01-01",
    sources: [{ name: "CRM-SP", type: "Conselho regional" }],
    unverifiedFields: [],
  },
};

describe("catalog validator", () => {
  it("validates a correct doctor record", () => {
    expect(() => validateDoctorImportRecord(validDoctor)).not.toThrow();
  });

  it("rejects empty doctor id", () => {
    expect(() => validateDoctorImportRecord({ ...validDoctor, id: "" })).toThrow(
      CatalogValidationError,
    );
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      validateDoctorImportRecord({
        ...validDoctor,
        location: { ...validDoctor.location, lat: Number.NaN },
      }),
    ).toThrow(CatalogValidationError);
  });

  it("rejects duplicate ids in payload", () => {
    expect(() =>
      validateCatalogImportPayload({ doctors: [validDoctor, validDoctor] }),
    ).toThrow(/duplicado/i);
  });

  it("rejects empty payload", () => {
    expect(() => validateCatalogImportPayload({ doctors: [] })).toThrow(CatalogValidationError);
  });

  it("rejects doctor without sources", () => {
    expect(() =>
      validateDoctorImportRecord({
        ...validDoctor,
        transparency: { ...validDoctor.transparency, sources: [] },
      }),
    ).toThrow(CatalogValidationError);
  });
});
