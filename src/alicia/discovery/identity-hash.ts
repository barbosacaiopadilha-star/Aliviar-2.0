import { createHash } from "node:crypto";

import { normalizeCrm, normalizeName, normalizeSpecialty, normalizeUf } from "./normalizer";

export function buildIdentityHash(input: {
  nome: string;
  crm: string;
  crmUf: string;
  especialidade: string;
}): string {
  const payload = {
    nome: normalizeName(input.nome),
    crm: normalizeCrm(input.crm),
    crmUf: normalizeUf(input.crmUf),
    especialidade: normalizeSpecialty(input.especialidade),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildCandidateId(identityHash: string): string {
  return `disc-${identityHash.slice(0, 12)}`;
}
