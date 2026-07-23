/** View model da primeira tela autenticada — apenas projeção, sem estado próprio. */
export interface PrimeiroPortalView {
  greeting: string;
  patientName: string;
  journeyState: string;
  narrativeCheckpoint: string;
  nextAction: string;
}
