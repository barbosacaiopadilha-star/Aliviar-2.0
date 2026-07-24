import type { EvidenceProvenance } from "./types";

export function createProvenance(
  input: Omit<EvidenceProvenance, "normalizationVersion"> & { normalizationVersion?: string },
  normalizationVersion: string,
): EvidenceProvenance {
  return {
    connectorId: input.connectorId,
    connectorVersion: input.connectorVersion,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    fetchTimestamp: input.fetchTimestamp,
    rawHash: input.rawHash,
    normalizationVersion: input.normalizationVersion ?? normalizationVersion,
    confidenceDaFonte: input.confidenceDaFonte,
  };
}

export function collectUniqueSources(provenance: EvidenceProvenance[]): string[] {
  const sources = new Set<string>();
  for (const item of provenance) {
    sources.add(item.sourceName);
  }
  return [...sources];
}

export function mergeProvenanceLists(
  lists: EvidenceProvenance[][],
): EvidenceProvenance[] {
  const seen = new Set<string>();
  const merged: EvidenceProvenance[] = [];

  for (const list of lists) {
    for (const item of list) {
      const key = `${item.connectorId}:${item.rawHash}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
  }

  return merged;
}
