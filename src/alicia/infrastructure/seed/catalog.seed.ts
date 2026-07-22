import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";
import catalogSeedJson from "@/alicia/infrastructure/seed/catalog.seed.json";

export const catalogSeed = catalogSeedJson as CatalogImportPayload;
