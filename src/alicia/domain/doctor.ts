import type { Fellowship } from "@/alicia/domain/fellowship";
import type { Institution } from "@/alicia/domain/institution";
import type { PracticeLocation } from "@/alicia/domain/practice-location";
import type { Residency } from "@/alicia/domain/residency";
import type { Source } from "@/alicia/domain/source";
import type { Specialty } from "@/alicia/domain/specialty";
import type { Verification } from "@/alicia/domain/verification";
import type { Education } from "@/alicia/domain/education";

export type InstitutionAffiliation = {
  institutionId: string;
  role: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialtyId: string;
  practiceLocation: PracticeLocation;
  mainInstitutionId: string;
  whoTheyAre: string;
  trajectory: string;
  graduationId: string;
  residencyIds: string[];
  fellowshipIds: string[];
  practiceAreas: string[];
  affiliations: InstitutionAffiliation[];
  scientificProductionPlaceholder: string;
  sourceIds: string[];
  lastUpdated: string;
  unverifiedFieldLabels: string[];
};

export type DoctorReadModel = {
  doctor: Doctor;
  specialty: Specialty;
  mainInstitution: Institution;
  graduation: Education;
  residencies: Residency[];
  fellowships: Fellowship[];
  affiliations: InstitutionAffiliation[];
  sources: Source[];
  institutions: Map<string, Institution>;
  verifications: Map<string, Verification>;
};

export type CatalogSnapshot = {
  doctors: Doctor[];
  specialties: Map<string, Specialty>;
  institutions: Map<string, Institution>;
  educations: Map<string, Education>;
  residencies: Map<string, Residency>;
  fellowships: Map<string, Fellowship>;
  sources: Map<string, Source>;
  verifications: Map<string, Verification>;
};
