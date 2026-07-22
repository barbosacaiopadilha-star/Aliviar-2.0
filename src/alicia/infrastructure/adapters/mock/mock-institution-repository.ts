import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import type { Institution } from "@/alicia/domain/institution";
import type { InstitutionRepository } from "@/alicia/application/ports/institution-repository";

export class MockInstitutionRepository implements InstitutionRepository {
  constructor(private readonly snapshot: CatalogSnapshot) {}

  findById(id: string): Institution | undefined {
    return this.snapshot.institutions.get(id);
  }

  findAll(): Institution[] {
    return [...this.snapshot.institutions.values()];
  }
}
