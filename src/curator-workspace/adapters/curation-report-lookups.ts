import type { CaseRepositoryPort, PatientRepositoryPort } from "@/case-registration/ports/case-registration-ports";
import type { JourneyKernelRepositoryPort } from "@/kernel/ports/kernel-ports";
import type {
  CaseContextRecord,
  CaseLookupPort,
  JourneyContextRecord,
  JourneyLookupPort,
  PatientContextRecord,
  PatientLookupPort,
} from "@/curation-report";

export class VerticalSliceCaseLookup implements CaseLookupPort {
  constructor(private readonly repository: CaseRepositoryPort) {}

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
  constructor(private readonly repository: JourneyKernelRepositoryPort) {}

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
  constructor(private readonly repository: PatientRepositoryPort) {}

  async findById(patientId: string): Promise<PatientContextRecord | null> {
    const record = await this.repository.findById(patientId);
    return record ? { id: record.id } : null;
  }
}
