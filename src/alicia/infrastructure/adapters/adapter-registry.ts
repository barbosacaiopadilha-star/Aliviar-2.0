import type { CatalogAdapterKind } from "@/alicia/catalog/composition-root";

export type { CatalogAdapterKind };

export function getAdapterLabel(adapter: CatalogAdapterKind): string {
  const labels: Record<CatalogAdapterKind, string> = {
    mock: "Mock Adapter",
    json: "JSON Adapter",
    csv: "CSV Adapter",
    supabase: "Supabase Adapter",
    crawler: "Crawler Adapter",
  };

  return labels[adapter];
}
