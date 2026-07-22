export type DataSource = {
  name: string;
  type: string;
  url?: string;
};

export type EducationEntry = {
  institution: string;
  program: string;
  period?: string;
  verified: boolean;
};

export type InstitutionAffiliation = {
  name: string;
  role: string;
  city: string;
};

export type DoctorLocation = {
  lat: number;
  lng: number;
  city: string;
  state: string;
};

export type DoctorTransparency = {
  lastUpdated: string;
  sourceCount: number;
  sources: DataSource[];
  unverifiedFields: string[];
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  location: DoctorLocation;
  mainInstitution: string;
  whoTheyAre: string;
  trajectory: string;
  graduation: EducationEntry;
  residency: EducationEntry[];
  fellowships: EducationEntry[];
  practiceAreas: string[];
  institutions: InstitutionAffiliation[];
  scientificProductionPlaceholder: string;
  transparency: DoctorTransparency;
};

export type DoctorFilters = {
  specialty: string;
  city: string;
  state: string;
  radiusKm: number | null;
  university: string;
  residency: string;
  fellowship: string;
  institution: string;
  practiceArea: string;
  search: string;
};

export type FilterOptions = {
  specialties: string[];
  cities: string[];
  states: string[];
  universities: string[];
  residencies: string[];
  fellowships: string[];
  institutions: string[];
  practiceAreas: string[];
};

export const EMPTY_FILTERS: DoctorFilters = {
  specialty: "",
  city: "",
  state: "",
  radiusKm: null,
  university: "",
  residency: "",
  fellowship: "",
  institution: "",
  practiceArea: "",
  search: "",
};
