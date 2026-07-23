/** Experiência narrativa de elaboração do relatório — não é checklist nem progresso. */
export interface RelatorioEmElaboracaoView {
  headline: string;
  narrative: string;
  continuation: string;
  patientName: string;
  journeyState: string;
  portalHref: string;
  elaborationStartedAt: string;
}
