import type { DoctorRepository } from "@/alicia/application/ports/doctor-repository";
import type { InstitutionRepository } from "@/alicia/application/ports/institution-repository";
import type { SourceRepository } from "@/alicia/application/ports/source-repository";
import { MockDoctorRepository } from "@/alicia/infrastructure/adapters/mock/mock-doctor-repository";
import { MockInstitutionRepository } from "@/alicia/infrastructure/adapters/mock/mock-institution-repository";
import { MockSourceRepository } from "@/alicia/infrastructure/adapters/mock/mock-source-repository";
import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import { normalizeCatalogImportPayload } from "@/alicia/infrastructure/import/normalizer";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";

export type CatalogAdapterKind = "mock" | "supabase" | "csv" | "json" | "crawler";

export type CatalogRepositories = {
  doctorRepository: DoctorRepository;
  institutionRepository: InstitutionRepository;
  sourceRepository: SourceRepository;
  snapshot: CatalogSnapshot;
};

export function createCatalogSnapshotFromSeed(): CatalogSnapshot {
  return normalizeCatalogImportPayload(catalogSeed);
}

export function createCatalogRepositories(
  adapter: CatalogAdapterKind = "mock",
  snapshot: CatalogSnapshot = createCatalogSnapshotFromSeed(),
): CatalogRepositories {
  switch (adapter) {
    case "mock":
    case "json":
      return {
        snapshot,
        doctorRepository: new MockDoctorRepository(snapshot),
        institutionRepository: new MockInstitutionRepository(snapshot),
        sourceRepository: new MockSourceRepository(snapshot),
      };
    case "csv":
    case "crawler":
    case "supabase":
      throw new Error(`Adapter "${adapter}" ainda não implementado. Use "mock" na Wave X2.`);
    default:
      throw new Error(`Adapter desconhecido: ${adapter as string}`);
  }
}
