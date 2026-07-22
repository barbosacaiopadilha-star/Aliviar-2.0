export type UserRole = "ADMIN" | "MANAGER" | "CURATOR" | "OPERATION" | "AUDITOR";
export type PatientStatus = "ACTIVE" | "INACTIVE";
export type JourneyStatus = "NEW" | "ACTIVE" | "WAITING" | "FINISHED" | "CANCELLED";
export type JourneyPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  preferred_name: string | null;
  birth_date: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  health_plan: string | null;
  status: PatientStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Journey {
  id: string;
  patient_id: string;
  title: string;
  objective: string | null;
  status: JourneyStatus;
  priority: JourneyPriority;
  manager_id: string;
  opened_at: string;
  closed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyWithRelations extends Journey {
  patient?: Pick<Patient, "id" | "full_name" | "preferred_name">;
  manager?: Pick<Profile, "id" | "full_name" | "role">;
}

export interface PatientWithJourneys extends Patient {
  journeys?: Journey[];
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor da Jornada",
  CURATOR: "Curador",
  OPERATION: "Operação",
  AUDITOR: "Auditor",
};

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const JOURNEY_STATUS_LABELS: Record<JourneyStatus, string> = {
  NEW: "Nova",
  ACTIVE: "Ativa",
  WAITING: "Aguardando",
  FINISHED: "Encerrada",
  CANCELLED: "Cancelada",
};

export const JOURNEY_PRIORITY_LABELS: Record<JourneyPriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function displayPatientName(patient: Pick<Patient, "full_name" | "preferred_name">): string {
  return patient.preferred_name?.trim() || patient.full_name;
}

export function isOpenJourneyStatus(status: JourneyStatus): boolean {
  return status === "NEW" || status === "ACTIVE" || status === "WAITING";
}
