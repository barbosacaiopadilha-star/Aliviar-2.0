import { describe, expect, it } from "vitest";

import { createCatalogRepositories } from "@/alicia/catalog/composition-root";
import { mapDoctorReadModelToViewModel } from "@/alicia/infrastructure/mappers/doctor-view-mapper";
import { importCatalogFromObject } from "@/alicia/infrastructure/import/json-importer";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";

describe("doctor view mapper", () => {
  const snapshot = importCatalogFromObject(catalogSeed);
  const repositories = createCatalogRepositories("mock", snapshot);

  it("maps domain read model to legacy view model", () => {
    const readModel = repositories.doctorRepository.findReadModelById("lucas-loss-possatti");
    const viewModel = mapDoctorReadModelToViewModel(readModel!);

    expect(viewModel.name).toBe("Dr. Lucas Loss Possatti");
    expect(viewModel.specialty).toBe("Neurocirurgia");
    expect(viewModel.location.city).toBe("Serra");
    expect(viewModel.graduation.institution).toContain("UFES");
    expect(viewModel.fellowships.length).toBeGreaterThan(0);
    expect(viewModel.transparency.sourceCount).toBeGreaterThanOrEqual(3);
  });
});
