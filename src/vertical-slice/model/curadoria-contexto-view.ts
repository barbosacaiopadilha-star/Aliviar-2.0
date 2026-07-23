import type { ContextHistoryEntry, ContextOrganizationGroup } from "./compartilhar-contexto-view";

/** O que a curadoria recebe após o paciente compartilhar contexto. */
export interface CuradoriaContextoView {
  journeyId: string;
  patientName: string;
  narrativeCheckpoint: string;
  caseTitle: string;
  comprehension: string;
  novoContextoDisponivel: boolean;
  sinalCuradoria: string | null;
  casoProntoParaAnalise: boolean;
  aberturaCuradoria: string | null;
  casoEmElaboracao: boolean;
  sinalElaboracao: string | null;
  espacoRelatorioPreparado: boolean;
  organizacao: ContextOrganizationGroup[];
  historico: ContextHistoryEntry[];
  memorySummary: string;
}
