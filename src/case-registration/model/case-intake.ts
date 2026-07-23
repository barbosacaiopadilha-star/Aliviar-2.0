import type { CaseContext } from "./case-context";
import type { JourneyOwnership } from "./journey-ownership";
import type { PatientAssociation } from "./patient";

/** Entrada de intake ÔÇö inten├º├úo antes de virar caso. */
export interface CaseIntake {
  patient: PatientAssociation;
  context: CaseContext;
  ownership: JourneyOwnership;
}

export function validateCaseIntake(intake: CaseIntake): string | null {
  if (!intake.context.title || intake.context.title.length < 3) {
    return "T├¡tulo do caso ├® obrigat├│rio.";
  }

  if (!intake.ownership.managerId) {
    return "Respons├ível (gestor) ├® obrigat├│rio.";
  }

  if (intake.patient.type === "new" && !intake.patient.data.fullName?.trim()) {
    return "Nome do paciente ├® obrigat├│rio.";
  }

  return null;
}
