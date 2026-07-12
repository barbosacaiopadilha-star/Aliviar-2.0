// ProviderRepository — porta de infraestrutura (não pertence ao Método nem
// aos contratos universais do ACE, por isso vive em ports/, não em core/).
// O P006 conhece apenas esta interface, nunca uma implementação concreta
// (banco, Supabase, API, cache) — ADR-013, docs/DECISIONS.md.
//
// CareProviderCandidate é definido de forma mínima para a responsabilidade
// do P006: apenas os dados necessários à elegibilidade. Não antecipa
// localização, preço, agenda, convênio, reputação, compatibilidade ou
// qualquer atributo de protocolos futuros (P007 em diante).

import type { ClinicalDomain } from "@/modules/ace/artifacts/decision-context";
import type { CompetencyFocus, ExperienceLevel } from "@/modules/ace/artifacts/competency-profile";

export type ProviderType = "individual" | "institution" | "team";

export type ProviderStatus = "active" | "inactive";

export type ProviderCompetencyArea = {
  domain: ClinicalDomain;
  focus: CompetencyFocus;
};

export type CareProviderCandidate = {
  providerId: string;
  providerType: ProviderType;
  status: ProviderStatus;
  competencyAreas: ProviderCompetencyArea[];
  experienceLevel: ExperienceLevel;
  // Metadata mínima de versionamento/rastreabilidade do registro no
  // repositório externo — não é o versionamento do artefato do ACE.
  recordVersion: number;
  lastVerifiedAt: string;
};

export interface ProviderRepository {
  findByDomain(domain: ClinicalDomain): Promise<CareProviderCandidate[]>;
}
