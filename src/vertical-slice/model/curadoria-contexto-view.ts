import type { ContextHistoryEntry, ContextOrganizationGroup } from "./compartilhar-contexto-view";

/** O que a curadoria recebe após o paciente compartilhar contexto. */
export interface CuradoriaContextoView {
  journeyId: string;
  patientName: string;
  narrativeCheckpoint: string;
  caseTitle: string;
  comprehension: string;
  organizacao: ContextOrganizationGroup[];
  historico: ContextHistoryEntry[];
  memorySummary: string;
}
