import { MIN_CONFIDENCE_FOR_QUEUE, SCOPED_SPECIALTIES, SCOPED_STATE } from "./constants";
import { buildCandidateId, buildIdentityHash } from "./identity-hash";
import {
  extractCrmParts,
  normalizeCity,
  normalizeName,
  normalizePhone,
  normalizeSpecialty,
  normalizeUrl,
  normalizeUf,
} from "./normalizer";
import type { DiscoveryCandidate, DiscoveryCandidateStatus, RawDiscoveryRecord } from "./types";

export function normalizeDiscoveryRecord(
  record: RawDiscoveryRecord,
  sourceId: string,
  discoveredAt: string,
): DiscoveryCandidate | null {
  const nome = normalizeName(record.nome);
  const especialidade = normalizeSpecialty(record.especialidade);
  const cidade = normalizeCity(record.cidade);
  const estado = normalizeUf(record.estado);
  const { crm, crmUf } = extractCrmParts(record.crm, record.crmUf);

  if (!nome || !SCOPED_SPECIALTIES.has(especialidade) || estado !== SCOPED_STATE) {
    return null;
  }

  const hashIdentidade = buildIdentityHash({ nome, crm, crmUf, especialidade });
  const confidence = record.confidence ?? 0.6;

  return {
    candidateId: buildCandidateId(hashIdentidade),
    nome,
    crm,
    crmUf,
    especialidade,
    cidade,
    estado,
    fonteOrigem: sourceId,
    fontesEncontradas: [sourceId],
    urlOrigem: normalizeUrl(record.urlOrigem),
    dataDescoberta: discoveredAt,
    confidence,
    hashIdentidade,
    status: "NORMALIZED",
    telefone: normalizePhone(record.telefone),
  };
}

export type DeduplicationResult = {
  unique: DiscoveryCandidate[];
  duplicates: DiscoveryCandidate[];
  ignored: DiscoveryCandidate[];
};

export function deduplicateCandidates(candidates: DiscoveryCandidate[]): DeduplicationResult {
  const byHash = new Map<string, DiscoveryCandidate>();
  const duplicates: DiscoveryCandidate[] = [];
  const ignored: DiscoveryCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.confidence < MIN_CONFIDENCE_FOR_QUEUE) {
      ignored.push({ ...candidate, status: "IGNORED" });
      continue;
    }

    const existing = byHash.get(candidate.hashIdentidade);
    if (!existing) {
      byHash.set(candidate.hashIdentidade, { ...candidate, status: "NORMALIZED" });
      continue;
    }

    const mergedSources = [...new Set([...existing.fontesEncontradas, ...candidate.fontesEncontradas])];
    byHash.set(candidate.hashIdentidade, {
      ...existing,
      fontesEncontradas: mergedSources,
      confidence: Math.max(existing.confidence, candidate.confidence),
      urlOrigem: existing.urlOrigem || candidate.urlOrigem,
      telefone: existing.telefone ?? candidate.telefone,
      status: "NORMALIZED",
    });

    duplicates.push({
      ...candidate,
      status: "DUPLICATE",
      fontesEncontradas: mergedSources,
    });
  }

  return {
    unique: [...byHash.values()],
    duplicates,
    ignored,
  };
}

export function markQueued(candidate: DiscoveryCandidate): DiscoveryCandidate {
  return {
    ...candidate,
    status: "QUEUED" satisfies DiscoveryCandidateStatus,
  };
}
