export type PatientStatus = "ACTIVE" | "INACTIVE";

/** Paciente associado a um caso. */
export interface PatientRecord {
  id: string;
  fullName: string;
  preferredName: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  city: string | null;
  state: string | null;
  status: PatientStatus;
  createdAt: string;
}

export interface NewPatientInput {
  fullName: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  city?: string | null;
  state?: string | null;
  healthPlan?: string | null;
}

export type PatientAssociation =
  | { type: "existing"; patientId: string }
  | { type: "new"; data: NewPatientInput };
