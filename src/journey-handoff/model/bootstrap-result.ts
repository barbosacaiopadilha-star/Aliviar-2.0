/** Resultado do bootstrap operacional — Journey nasce do handoff, nunca o contrário. */
export interface JourneyOwnership {
  managerId: string | null;
  assignedCuratorId: string | null;
}

export interface JourneyBootstrapResult {
  caseId: string;
  patientId: string;
  journeyId: string;
  ownership: JourneyOwnership;
  bootstrappedAt: string;
}

export interface BootstrapPatientInput {
  fullName: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface BootstrapJourneyInput {
  handoffId: string;
  intention: import("./visitor-intention").VisitorIntention;
  patient: BootstrapPatientInput;
  journeyTitle: string;
  journeyObjective?: string | null;
  managerId?: string | null;
}
