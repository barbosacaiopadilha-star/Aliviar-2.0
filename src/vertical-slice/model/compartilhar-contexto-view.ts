export interface SharedContextItemView {
  id: string;
  label: string;
  detail: string | null;
  sharedAt: string;
}

export interface ContextOrganizationGroup {
  title: string;
  items: SharedContextItemView[];
}

export interface ContextHistoryEntry {
  id: string;
  headline: string;
  occurredAt: string;
}

/** Experiência de compartilhamento — não é tela de upload. */
export interface CompartilharContextoView {
  invitation: string;
  reassurance: string;
  journeyId: string;
  patientName: string;
  organizacao: ContextOrganizationGroup[];
  historico: ContextHistoryEntry[];
  hasSharedBefore: boolean;
}
