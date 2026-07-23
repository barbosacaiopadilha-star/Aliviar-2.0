/** Experiência narrativa de confirmação — não é tela de sucesso nem notificação. */
export interface HistoriaRecebidaView {
  headline: string;
  narrative: string;
  continuation: string;
  patientName: string;
  journeyState: string;
  portalHref: string;
  receivedAt: string;
}
