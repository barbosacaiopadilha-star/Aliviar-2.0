export interface ShareDocumentInput {
  name: string;
  where: string;
  note?: string | null;
}

export interface ShareReferenceInput {
  label: string;
  url: string;
}

export interface SharePatientContextInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  observation?: string | null;
  document?: ShareDocumentInput | null;
  reference?: ShareReferenceInput | null;
}

export interface SharePatientContextResult {
  sharedItems: number;
  confirmationPath: string;
}
