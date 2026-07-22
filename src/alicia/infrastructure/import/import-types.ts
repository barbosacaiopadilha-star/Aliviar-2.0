export type DoctorImportEducation = {
  institution: string;
  program: string;
  period?: string;
  verified: boolean;
  institutionCity?: string;
  institutionState?: string;
};

export type DoctorImportAffiliation = {
  name: string;
  role: string;
  city: string;
  state?: string;
};

export type DoctorImportSource = {
  name: string;
  type: string;
  url?: string;
};

export type DoctorImportRecord = {
  id: string;
  name: string;
  specialty: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  mainInstitution: string;
  whoTheyAre: string;
  trajectory: string;
  graduation: DoctorImportEducation;
  residency: DoctorImportEducation[];
  fellowships: DoctorImportEducation[];
  practiceAreas: string[];
  institutions: DoctorImportAffiliation[];
  scientificProductionPlaceholder: string;
  transparency: {
    lastUpdated: string;
    sources: DoctorImportSource[];
    unverifiedFields: string[];
  };
};

export type CatalogImportPayload = {
  doctors: DoctorImportRecord[];
};

export type CsvDoctorRow = Record<string, string>;
