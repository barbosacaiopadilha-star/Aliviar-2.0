import type { CatalogSnapshot, DoctorReadModel } from "@/alicia/domain/doctor";
import type { Doctor } from "@/alicia/domain/doctor";
import type { DoctorRepository } from "@/alicia/application/ports/doctor-repository";

function buildReadModel(snapshot: CatalogSnapshot, doctor: Doctor): DoctorReadModel {
  const specialty = snapshot.specialties.get(doctor.specialtyId);
  const mainInstitution = snapshot.institutions.get(doctor.mainInstitutionId);
  const graduation = snapshot.educations.get(doctor.graduationId);

  if (!specialty || !mainInstitution || !graduation) {
    throw new Error(`Dados incompletos para o médico ${doctor.id}.`);
  }

  const residencies = doctor.residencyIds.map((id) => {
    const residency = snapshot.residencies.get(id);
    if (!residency) {
      throw new Error(`Residência ${id} não encontrada.`);
    }
    return residency;
  });

  const fellowships = doctor.fellowshipIds.map((id) => {
    const fellowship = snapshot.fellowships.get(id);
    if (!fellowship) {
      throw new Error(`Fellowship ${id} não encontrada.`);
    }
    return fellowship;
  });

  const sources = doctor.sourceIds.map((id) => {
    const source = snapshot.sources.get(id);
    if (!source) {
      throw new Error(`Fonte ${id} não encontrada.`);
    }
    return source;
  });

  return {
    doctor,
    specialty,
    mainInstitution,
    graduation,
    residencies,
    fellowships,
    affiliations: doctor.affiliations,
    sources,
    institutions: snapshot.institutions,
    verifications: snapshot.verifications,
  };
}

export class MockDoctorRepository implements DoctorRepository {
  private readonly snapshot: CatalogSnapshot;
  private readonly readModels: Map<string, DoctorReadModel>;

  constructor(snapshot: CatalogSnapshot) {
    this.snapshot = snapshot;
    this.readModels = new Map(
      snapshot.doctors.map((doctor) => [doctor.id, buildReadModel(snapshot, doctor)]),
    );
  }

  findAll(): Doctor[] {
    return [...this.snapshot.doctors];
  }

  findById(id: string): Doctor | undefined {
    return this.snapshot.doctors.find((doctor) => doctor.id === id);
  }

  findReadModelById(id: string): DoctorReadModel | undefined {
    return this.readModels.get(id);
  }

  findAllReadModels(): DoctorReadModel[] {
    return [...this.readModels.values()];
  }
}
