import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import type { Source } from "@/alicia/domain/source";
import type { SourceRepository } from "@/alicia/application/ports/source-repository";

export class MockSourceRepository implements SourceRepository {
  constructor(private readonly snapshot: CatalogSnapshot) {}

  findById(id: string): Source | undefined {
    return this.snapshot.sources.get(id);
  }

  findByDoctorId(doctorId: string): Source[] {
    const doctor = this.snapshot.doctors.find((entry) => entry.id === doctorId);
    if (!doctor) {
      return [];
    }

    return doctor.sourceIds
      .map((sourceId) => this.snapshot.sources.get(sourceId))
      .filter((source): source is Source => Boolean(source));
  }

  findAll(): Source[] {
    return [...this.snapshot.sources.values()];
  }
}
