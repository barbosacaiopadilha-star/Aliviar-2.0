import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";
import { normalizeCatalogImportPayload } from "@/alicia/infrastructure/import/normalizer";

export function importCatalogFromJson(raw: string): ReturnType<typeof normalizeCatalogImportPayload> {
  const payload = JSON.parse(raw) as CatalogImportPayload;
  return normalizeCatalogImportPayload(payload);
}

export function importCatalogFromObject(
  payload: CatalogImportPayload,
): ReturnType<typeof normalizeCatalogImportPayload> {
  return normalizeCatalogImportPayload(payload);
}
