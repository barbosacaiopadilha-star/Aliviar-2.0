// InMemoryProviderRepository — implementação de testes do ProviderRepository.
// Nunca persistência real (Supabase, banco). Existe apenas para permitir
// testar o P006 sem depender de um catálogo real, que ainda não existe no
// produto (`aliviar-conexao`).

import type { ClinicalDomain } from "@/modules/ace/artifacts/decision-context";
import type { CareProviderCandidate, ProviderRepository } from "@/modules/ace/ports/provider-repository";

export class InMemoryProviderRepository implements ProviderRepository {
  constructor(private readonly candidates: readonly CareProviderCandidate[]) {}

  async findByDomain(domain: ClinicalDomain): Promise<CareProviderCandidate[]> {
    return this.candidates.filter((candidate) =>
      candidate.competencyAreas.some((area) => area.domain === domain),
    );
  }
}
