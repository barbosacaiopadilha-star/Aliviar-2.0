// ProviderProfileRepository — porta de infraestrutura separada do
// ProviderRepository (P006).
//
// Alternativa escolhida e motivo (ver docs/ace/04-specs/P007-compatibility-
// matrix-builder/specification.md, seção "Dados do Provider"): em vez de
// evoluir CareProviderCandidate com os campos que o P007 precisa, criei um
// tipo novo, CareProviderProfile, que estende CareProviderCandidate com
// exatamente 3 campos — cada um mapeado a uma única dimensão da
// CompatibilityMatrix (strategyAlignment, continuityAlignment,
// contextAlignment). Isso respeita a instrução explícita de não aumentar
// silenciosamente o tipo do P006: o P006 continua vendo apenas
// CareProviderCandidate; só o P007, que precisa de mais dado, depende
// deste tipo mais rico e desta porta separada.

import type { Strategy } from "@/modules/ace/artifacts/decision-context";
import type { CareProviderCandidate } from "@/modules/ace/ports/provider-repository";

// strategyAlignment: como o provider prefere iniciar o atendimento,
// comparado à Estratégia do Contexto de Decisão. "ambos" quando o provider
// atende das duas formas.
export type ProviderIntakeApproach = Strategy | "ambos";

export type CareProviderProfile = CareProviderCandidate & {
  // strategyAlignment
  intakeApproach: ProviderIntakeApproach;
  // continuityAlignment — null quando o repositório não tem essa
  // informação registrada para o provider.
  offersContinuousCare: boolean | null;
  // contextAlignment — null quando o repositório não tem essa informação
  // registrada para o provider.
  availabilityWindow: "flexible" | "limited" | "unavailable_soon" | null;
};

export interface ProviderProfileRepository {
  findByIds(providerIds: string[]): Promise<CareProviderProfile[]>;
}
