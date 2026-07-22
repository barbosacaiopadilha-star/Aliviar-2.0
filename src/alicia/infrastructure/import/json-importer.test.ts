import { describe, expect, it } from "vitest";

import { importCatalogFromJson, importCatalogFromObject } from "@/alicia/infrastructure/import/json-importer";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";

describe("json importer", () => {
  it("imports catalog from object", () => {
    const snapshot = importCatalogFromObject(catalogSeed);
    expect(snapshot.doctors).toHaveLength(catalogSeed.doctors.length);
  });

  it("imports catalog from json string", () => {
    const snapshot = importCatalogFromJson(JSON.stringify(catalogSeed));
    expect(snapshot.doctors).toHaveLength(catalogSeed.doctors.length);
  });
});
