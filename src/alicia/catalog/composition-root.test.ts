import { describe, expect, it } from "vitest";

import { createCatalogRepositories } from "@/alicia/catalog/composition-root";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";
import { slugify } from "@/alicia/infrastructure/import/slug";

describe("composition root", () => {
  it("creates mock repositories by default", () => {
    const repositories = createCatalogRepositories("mock");
    expect(repositories.doctorRepository.findAll()).toHaveLength(catalogSeed.doctors.length);
  });

  it("rejects unsupported adapters", () => {
    expect(() => createCatalogRepositories("supabase")).toThrow(/não implementado/i);
    expect(() => createCatalogRepositories("crawler")).toThrow(/não implementado/i);
    expect(() => createCatalogRepositories("csv")).toThrow(/não implementado/i);
  });

  it("slugifies values consistently", () => {
    expect(slugify("Hospital Sírio-Libanês")).toBe("hospital-sirio-libanes");
  });
});
