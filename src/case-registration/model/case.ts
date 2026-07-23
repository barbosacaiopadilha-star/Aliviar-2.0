import { err, type Result } from "@/domain/shared/result";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";

import type { CaseContext } from "./case-context";
import type { JourneyOwnership } from "./journey-ownership";
import type { CaseStatus } from "./case-context";

/**
 * Caso ÔÇö aggregate root do registro.
 * Toda Journey nasce de um Caso; nunca o contr├írio.
 */
export interface CaseRecord {
  id: string;
  patientId: string;
  journeyId: string | null;
  context: CaseContext;
  ownership: JourneyOwnership;
  status: CaseStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseDraftParams {
  id: string;
  patientId: string;
  context: CaseContext;
  ownership: JourneyOwnership;
  createdBy: string;
  occurredAt: string;
}

export class CaseAggregate {
  private constructor(private readonly record: CaseRecord) {}

  static createDraft(params: CreateCaseDraftParams): CaseAggregate {
    return new CaseAggregate({
      id: params.id,
      patientId: params.patientId,
      journeyId: null,
      context: params.context,
      ownership: params.ownership,
      status: "OPEN",
      createdBy: params.createdBy,
      createdAt: params.occurredAt,
      updatedAt: params.occurredAt,
    });
  }

  static rehydrate(record: CaseRecord): Result<CaseAggregate, BusinessRuleError> {
    if (record.journeyId && record.status === "OPEN") {
      return err(new BusinessRuleError("Caso com jornada n├úo pode permanecer OPEN."));
    }

    return { ok: true, value: new CaseAggregate(record) };
  }

  get id(): string {
    return this.record.id;
  }

  get patientId(): string {
    return this.record.patientId;
  }

  get journeyId(): string | null {
    return this.record.journeyId;
  }

  get ownership(): JourneyOwnership {
    return this.record.ownership;
  }

  get hasJourney(): boolean {
    return this.record.journeyId !== null;
  }

  bootstrapJourney(journeyId: string, occurredAt: string): Result<CaseAggregate, BusinessRuleError> {
    if (this.record.journeyId) {
      return err(new BusinessRuleError("Caso j├í possui jornada associada."));
    }

    return {
      ok: true,
      value: new CaseAggregate({
        ...this.record,
        journeyId,
        status: "ACTIVE",
        updatedAt: occurredAt,
      }),
    };
  }

  toRecord(): CaseRecord {
    return { ...this.record };
  }
}
