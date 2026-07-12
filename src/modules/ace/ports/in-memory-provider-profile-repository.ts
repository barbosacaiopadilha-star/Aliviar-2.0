// InMemoryProviderProfileRepository — implementação de testes do
// ProviderProfileRepository. Nunca persistência real.

import type {
  CareProviderProfile,
  ProviderProfileRepository,
} from "@/modules/ace/ports/provider-profile-repository";

export class InMemoryProviderProfileRepository implements ProviderProfileRepository {
  constructor(private readonly profiles: readonly CareProviderProfile[]) {}

  async findByIds(providerIds: string[]): Promise<CareProviderProfile[]> {
    const idSet = new Set(providerIds);
    return this.profiles.filter((profile) => idSet.has(profile.providerId));
  }
}
