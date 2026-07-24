import type { NormalizedConnectorRecord } from "@/alicia/connectors";
import { buildCandidateId, buildIdentityHash } from "@/alicia/discovery/identity-hash";
import {
  extractCrmParts,
  normalizeName,
  normalizeSpecialty,
} from "@/alicia/discovery/normalizer";

import type { CollectedRecord, CollectorResult, ConnectorEvidenceInput } from "./types";

export function buildCandidateKey(record: {
  nome: string;
  crm: string;
  crmUf: string;
}): string {
  const { crm, crmUf } = extractCrmParts(record.crm, record.crmUf);
  if (crm) {
    return `crm:${crmUf}:${crm}`;
  }

  const nome = normalizeName(record.nome);
  return `nome:${nome.toLowerCase()}`;
}

export function buildCandidateIdFromRecord(record: {
  nome: string;
  crm: string;
  crmUf: string;
  especialidade: string;
}): string {
  const { crm, crmUf } = extractCrmParts(record.crm, record.crmUf);
  const nome = normalizeName(record.nome);
  const especialidade = normalizeSpecialty(record.especialidade);

  const hash = buildIdentityHash({ nome, crm, crmUf, especialidade });
  return buildCandidateId(hash);
}

export class EvidenceCollector {
  collect(inputs: ConnectorEvidenceInput[]): CollectorResult[] {
    const groups = new Map<string, CollectorResult>();

    for (const input of inputs) {
      if (!input.success) {
        continue;
      }

      for (const record of input.records) {
        const candidateKey = buildCandidateKey(record);
        const candidateId = buildCandidateIdFromRecord(record);
        const collected: CollectedRecord = { input, record };

        const existing = groups.get(candidateKey);
        if (existing) {
          existing.records.push(collected);
        } else {
          groups.set(candidateKey, {
            candidateKey,
            candidateId,
            records: [collected],
          });
        }
      }
    }

    return [...groups.values()];
  }
}
