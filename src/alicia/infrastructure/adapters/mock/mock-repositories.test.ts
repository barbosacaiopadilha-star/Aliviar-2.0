import { describe, expect, it } from "vitest";

import { createCatalogRepositories } from "@/alicia/catalog/composition-root";
import { importCatalogFromObject } from "@/alicia/infrastructure/import/json-importer";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";

describe("mock repositories", () => {
  const snapshot = importCatalogFromObject(catalogSeed);
  const repositories = createCatalogRepositories("mock", snapshot);

  it("lists all doctors", () => {
    expect(repositories.doctorRepository.findAll()).toHaveLength(catalogSeed.doctors.length);
  });

  it("finds doctor by id", () => {
    const doctor = repositories.doctorRepository.findById("joao-donatelli");
    expect(doctor?.name).toBe("Dr. João Donatelli");
  });

  it("resolves institution by id", () => {
    const doctor = repositories.doctorRepository.findById("joao-donatelli");
    const institution = repositories.institutionRepository.findById(doctor!.mainInstitutionId);
    expect(institution?.name).toBe("Hospital Bento Ferreira");
  });

  it("lists sources by doctor", () => {
    const sources = repositories.sourceRepository.findByDoctorId("joao-donatelli");
    expect(sources.length).toBe(5);
  });

  it("returns empty sources for unknown doctor", () => {
    expect(repositories.sourceRepository.findByDoctorId("inexistente")).toEqual([]);
  });

  it("finds source and institution by id", () => {
    const source = repositories.sourceRepository.findAll()[0];
    expect(repositories.sourceRepository.findById(source.id)?.name).toBeTruthy();
    expect(repositories.institutionRepository.findAll().length).toBeGreaterThan(0);
  });

  it("returns undefined for unknown doctor id", () => {
    expect(repositories.doctorRepository.findById("inexistente")).toBeUndefined();
    expect(repositories.doctorRepository.findReadModelById("inexistente")).toBeUndefined();
  });
});
