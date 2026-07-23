import type { InMemoryCaseRepository, InMemoryPatientRepository } from "@/case-registration/infrastructure/in-memory-repositories";
import type { InMemoryJourneyKernelRepository } from "@/kernel";
import type {
  CaseContextRecord,
  CaseLookupPort,
  JourneyContextRecord,
  JourneyLookupPort,
  PatientContextRecord,
  PatientLookupPort,
} from "@/curation-report";

export class VerticalSliceCaseLookup implements CaseLookupPort {
  constructor(private readonly repository: InMemoryCaseRepository) {}

  async findById(caseId: string): Promise<CaseContextRecord | null> {
    const record = await this.repository.findById(caseId);
    if (!record) return null;
    return {
      id: record.id,
      patientId: record.patientId,
      journeyId: record.journeyId,
    };
  }
}

export class VerticalSliceJourneyLookup implements JourneyLookupPort {
  constructor(private readonly repository: InMemoryJourneyKernelRepository) {}

  async findById(journeyId: string): Promise<JourneyContextRecord | null> {
    const record = await this.repository.findById(journeyId);
    if (!record) return null;
    return {
      id: record.id,
      patientId: record.patientId,
    };
  }
}

export class VerticalSlicePatientLookup implements PatientLookupPort {
  constructor(private readonly repository: InMemoryPatientRepository) {}

  async findById(patientId: string): Promise<PatientContextRecord | null> {
    const record = await this.repository.findById(patientId);
    return record ? { id: record.id } : null;
  }
}
