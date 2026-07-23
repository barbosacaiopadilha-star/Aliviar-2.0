import { randomUUID } from "node:crypto";

import type { CaseRecord } from "../model/case";
import type { CaseRegistrationEvent } from "../events/case-registration-events";
import type { CaseRepositoryPort } from "../ports/case-registration-ports";
import type { NewPatientInput, PatientRecord } from "../model/patient";
import type { PatientRepositoryPort } from "../ports/case-registration-ports";

export class InMemoryCaseRepository implements CaseRepositoryPort {
  private readonly cases = new Map<string, CaseRecord>();
  private readonly events = new Map<string, CaseRegistrationEvent[]>();

  async save(record: CaseRecord, registrationEvents: CaseRegistrationEvent[]): Promise<CaseRecord> {
    this.cases.set(record.id, record);
    if (registrationEvents.length > 0) {
      const current = this.events.get(record.id) ?? [];
      this.events.set(record.id, [...current, ...registrationEvents]);
    }
    return record;
  }

  async findById(id: string): Promise<CaseRecord | null> {
    return this.cases.get(id) ?? null;
  }

  async findByJourneyId(journeyId: string): Promise<CaseRecord | null> {
    return [...this.cases.values()].find((record) => record.journeyId === journeyId) ?? null;
  }

  listEvents(caseId: string): CaseRegistrationEvent[] {
    return [...(this.events.get(caseId) ?? [])];
  }
}

export class InMemoryPatientRepository implements PatientRepositoryPort {
  private readonly patients = new Map<string, PatientRecord>();

  async create(input: NewPatientInput, createdAt: string): Promise<PatientRecord> {
    const record: PatientRecord = {
      id: randomUUID(),
      fullName: input.fullName.trim(),
      preferredName: input.preferredName?.trim() ?? null,
      email: input.email?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      cpf: input.cpf?.trim() ?? null,
      city: input.city?.trim() ?? null,
      state: input.state?.trim() ?? null,
      status: "ACTIVE",
      createdAt,
    };
    this.patients.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<PatientRecord | null> {
    return this.patients.get(id) ?? null;
  }

  async findByCpf(cpf: string): Promise<PatientRecord | null> {
    const normalized = cpf.trim();
    return [...this.patients.values()].find((p) => p.cpf === normalized) ?? null;
  }
}
