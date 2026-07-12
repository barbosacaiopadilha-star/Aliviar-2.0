// Implementação de testes de ProviderPresentationRepository — nenhuma
// persistência real (Sprint 11: "não implemente persistência real, use
// implementação em memória nos testes").

import type { CareProviderPresentation, ProviderPresentationRepository } from "./provider-presentation-repository";

export class InMemoryProviderPresentationRepository implements ProviderPresentationRepository {
  private readonly presentations: CareProviderPresentation[];

  constructor(presentations: CareProviderPresentation[]) {
    this.presentations = presentations;
  }

  async findByIds(providerIds: string[]): Promise<CareProviderPresentation[]> {
    const idSet = new Set(providerIds);
    return this.presentations.filter((presentation) => idSet.has(presentation.providerId));
  }
}
