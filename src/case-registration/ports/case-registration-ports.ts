import type { CaseRecord } from "../model/case";
import type { PatientRecord, NewPatientInput } from "../model/patient";
import type { CaseRegistrationEvent } from "../events/case-registration-events";

export interface CaseRepositoryPort {
  save(record: CaseRecord, events: CaseRegistrationEvent[]): Promise<CaseRecord>;
  findById(id: string): Promise<CaseRecord | null>;
  findByJourneyId(journeyId: string): Promise<CaseRecord | null>;
}

export interface PatientRepositoryPort {
  create(input: NewPatientInput, createdAt: string): Promise<PatientRecord>;
  findById(id: string): Promise<PatientRecord | null>;
  findByCpf(cpf: string): Promise<PatientRecord | null>;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface ClockPort {
  now(): string;
}
