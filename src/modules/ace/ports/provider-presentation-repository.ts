// ProviderPresentationRepository — porta de infraestrutura separada de
// ProviderProfileRepository (P007).
//
// Alternativa escolhida e motivo (ver docs/ace/04-specs/P010-final-
// curadoria-delivery/specification.md, seção "Porta de dados de
// apresentação"): em vez de reaproveitar o ProviderProfileRepository
// (cujos campos — competencyAreas, experienceLevel, intakeApproach,
// offersContinuousCare, availabilityWindow — são dados de ANÁLISE,
// nunca pensados para exibição ao cliente), criei uma porta nova e
// deliberadamente mínima, com apenas os dados de identidade/apresentação
// institucional necessários para a FinalCuradoria. Isso preserva a
// separação explícita exigida pelo Método entre dado usado para análise
// e dado usado para apresentação — o P010 nunca deriva texto de
// apresentação a partir de campos de análise, e vice-versa.

export type CareProviderPresentation = {
  providerId: string;
  displayName: string;
  professionalSummary: string;
  practicalConsiderations: string[];
};

export interface ProviderPresentationRepository {
  findByIds(providerIds: string[]): Promise<CareProviderPresentation[]>;
}
