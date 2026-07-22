import type { DoctorReadModel } from "@/alicia/domain/doctor";
import type { Doctor as DoctorViewModel } from "@/alicia/types";

function mapEducation(
  readModel: DoctorReadModel,
  educationId: string,
  collection: "educations" | "residencies" | "fellowships",
): { institution: string; program: string; period?: string; verified: boolean } {
  const entry =
    collection === "educations"
      ? readModel.graduation
      : collection === "residencies"
        ? readModel.residencies.find((item) => item.id === educationId)
        : readModel.fellowships.find((item) => item.id === educationId);

  if (!entry) {
    throw new Error(`Registro educacional ${educationId} não encontrado.`);
  }

  const institution = readModel.institutions.get(entry.institutionId);
  const verification = readModel.verifications.get(entry.verificationId);

  if (!institution || !verification) {
    throw new Error(`Dependências ausentes para ${educationId}.`);
  }

  return {
    institution: institution.name,
    program: entry.program,
    period: entry.period,
    verified: verification.status === "verified",
  };
}

export function mapDoctorReadModelToViewModel(readModel: DoctorReadModel): DoctorViewModel {
  const { doctor } = readModel;

  return {
    id: doctor.id,
    name: doctor.name,
    specialty: readModel.specialty.name,
    location: doctor.practiceLocation,
    mainInstitution: readModel.mainInstitution.name,
    whoTheyAre: doctor.whoTheyAre,
    trajectory: doctor.trajectory,
    graduation: mapEducation(readModel, doctor.graduationId, "educations"),
    residency: doctor.residencyIds.map((id) => mapEducation(readModel, id, "residencies")),
    fellowships: doctor.fellowshipIds.map((id) => mapEducation(readModel, id, "fellowships")),
    practiceAreas: [...doctor.practiceAreas],
    institutions: doctor.affiliations.map((affiliation) => {
      const institution = readModel.institutions.get(affiliation.institutionId);
      if (!institution) {
        throw new Error(`Instituição ${affiliation.institutionId} não encontrada.`);
      }
      return {
        name: institution.name,
        role: affiliation.role,
        city: institution.city,
      };
    }),
    scientificProductionPlaceholder: doctor.scientificProductionPlaceholder,
    transparency: {
      lastUpdated: doctor.lastUpdated,
      sourceCount: readModel.sources.length,
      sources: readModel.sources.map((source) => ({
        name: source.name,
        type: source.type,
        url: source.url,
      })),
      unverifiedFields: [...doctor.unverifiedFieldLabels],
    },
  };
}

export function mapDoctorReadModelsToViewModels(readModels: DoctorReadModel[]): DoctorViewModel[] {
  return readModels.map(mapDoctorReadModelToViewModel);
}
