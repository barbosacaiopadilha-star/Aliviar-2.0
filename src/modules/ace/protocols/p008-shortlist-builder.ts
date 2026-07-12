// P008 — Shortlist Builder.
// Ver docs/ace/04-specs/P008-shortlist-builder/specification.md.
//
// Determinístico e puramente qualitativo: nenhuma agregação numérica é
// usada para decidir quais Care Providers compõem a Shortlist.
//
// Correção obrigatória (Sprint 10): a ordenação por providerId é válida
// apenas para serialização neutra — ela nunca decide quais providers
// entram na Shortlist. Quando há mais de três candidatos igualmente
// fundamentados (qualificados) e a CompatibilityMatrix não contém nenhum
// critério legítimo para reduzir esse conjunto a três sem arbitrariedade,
// o resultado é BLOCKED (AMBIGUOUS_COMPOSITION) — nunca uma seleção dos
// três primeiros por ordem alfabética, que seria um ranking disfarçado de
// critério de desempate.

import { isEssentiallyQualified, type CompatibilityEntry, type CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import {
  createShortlist,
  type ProviderRationale,
  type Shortlist,
  type ShortlistBlockedReason,
} from "@/modules/ace/artifacts/shortlist";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";

const METHOD_VERSION = "ACE-0.1";
const SHORTLIST_SIZE = 3;

export type P008Input = {
  compatibilityMatrix: CompatibilityMatrix;
};

function byProviderId(a: CompatibilityEntry, b: CompatibilityEntry): number {
  return a.providerId.localeCompare(b.providerId);
}

function buildProviderRationale(entry: CompatibilityEntry): ProviderRationale {
  const strongDimensions = Object.entries(entry.dimensionResults)
    .filter(([, result]) => result.classification === "STRONG")
    .map(([name]) => name);

  const parts = [
    "Atende aos requisitos essenciais de competência e experiência já validados pelo Conjunto de Providers Elegíveis (P006).",
  ];

  if (strongDimensions.length > 0) {
    parts.push(`Forte alinhamento em: ${strongDimensions.join(", ")}.`);
  }
  if (entry.limitations.length > 0) {
    parts.push(`Limitações registradas: ${entry.limitations.join(" ")}`);
  }
  if (entry.missingInformation.length > 0) {
    parts.push(`Informações ausentes: ${entry.missingInformation.join(" ")}`);
  }

  return { providerId: entry.providerId, rationale: parts.join(" ") };
}

function aggregateFrom(entries: CompatibilityEntry[], field: "limitations" | "missingInformation"): string[] {
  const items: string[] = [];
  for (const entry of entries) {
    for (const item of entry[field]) {
      items.push(`${entry.providerId}: ${item}`);
    }
  }
  return items;
}

function buildSourceArtifact(compatibilityMatrix: CompatibilityMatrix) {
  return {
    artifactId: compatibilityMatrix.id,
    artifactVersion: compatibilityMatrix.version,
    artifactType: "CompatibilityMatrix" as const,
  };
}

function buildBlockedShortlist(
  compatibilityMatrix: CompatibilityMatrix,
  qualified: CompatibilityEntry[],
  reason: ShortlistBlockedReason,
): Shortlist {
  const totalCount = compatibilityMatrix.entries.length;
  const qualifiedCount = qualified.length;

  const reasonText: Record<ShortlistBlockedReason, string> = {
    INSUFFICIENT_OPTIONS: `A CompatibilityMatrix contém apenas ${totalCount} Care Provider(s) avaliado(s) — são necessários ao menos ${SHORTLIST_SIZE} para compor uma Shortlist.`,
    INSUFFICIENT_EVIDENCE: `Apenas ${qualifiedCount} de ${totalCount} Care Providers avaliados atendem aos requisitos essenciais de competência e experiência — são necessários ao menos ${SHORTLIST_SIZE} para compor uma Shortlist. O Método nunca reduz o padrão de qualidade apenas para completar três nomes.`,
    AMBIGUOUS_COMPOSITION: `${qualifiedCount} Care Providers atendem igualmente aos requisitos essenciais, e a CompatibilityMatrix não contém critério legítimo para reduzir esse conjunto a três sem arbitrariedade. Todos os ${qualifiedCount} candidatos aptos foram preservados para revisão humana (P009) — o Método nunca desempata por ordem alfabética ou qualquer outro critério que equivalha a um ranking disfarçado.`,
  };

  const sortedQualified = [...qualified].sort(byProviderId);
  const candidateProviderIds = sortedQualified.map((entry) => entry.providerId);
  const providerRationales = sortedQualified.map(buildProviderRationale);

  return createShortlist({
    status: "BLOCKED",
    blockedReason: reason,
    selectedProviderIds: [],
    candidateProviderIds,
    providerRationales,
    compositionRationale: reasonText[reason],
    relevantLimitations: aggregateFrom(compatibilityMatrix.entries, "limitations"),
    missingInformation: aggregateFrom(compatibilityMatrix.entries, "missingInformation"),
    sourceArtifact: buildSourceArtifact(compatibilityMatrix),
    methodVersion: METHOD_VERSION,
  });
}

function buildComposedShortlist(compatibilityMatrix: CompatibilityMatrix, qualified: CompatibilityEntry[]): Shortlist {
  // Neste ponto, qualified.length === SHORTLIST_SIZE exatamente — a
  // ordenação abaixo é apenas para serialização neutra, nunca para
  // decidir quem compõe a Shortlist (essa decisão já está feita: todos os
  // qualificados entram).
  const selected = [...qualified].sort(byProviderId);

  const selectedProviderIds = selected.map((entry) => entry.providerId);
  const providerRationales = selected.map(buildProviderRationale);

  return createShortlist({
    status: "COMPOSED",
    blockedReason: null,
    selectedProviderIds,
    candidateProviderIds: [],
    providerRationales,
    compositionRationale: `Os ${SHORTLIST_SIZE} Care Providers elegíveis atendem aos requisitos essenciais de competência e experiência.`,
    relevantLimitations: aggregateFrom(selected, "limitations"),
    missingInformation: aggregateFrom(selected, "missingInformation"),
    sourceArtifact: buildSourceArtifact(compatibilityMatrix),
    methodVersion: METHOD_VERSION,
  });
}

export const p008ShortlistBuilder: ProtocolContract<P008Input, Shortlist> = {
  id: "P008",
  name: "Shortlist Builder",
  async execute(input: P008Input): Promise<Shortlist> {
    const qualified = input.compatibilityMatrix.entries.filter(isEssentiallyQualified);

    if (qualified.length === SHORTLIST_SIZE) {
      return buildComposedShortlist(input.compatibilityMatrix, qualified);
    }

    if (qualified.length < SHORTLIST_SIZE) {
      const reason: ShortlistBlockedReason =
        input.compatibilityMatrix.entries.length < SHORTLIST_SIZE ? "INSUFFICIENT_OPTIONS" : "INSUFFICIENT_EVIDENCE";
      return buildBlockedShortlist(input.compatibilityMatrix, qualified, reason);
    }

    // qualified.length > SHORTLIST_SIZE — mais de três igualmente
    // fundamentados, sem critério legítimo de desempate na matriz.
    return buildBlockedShortlist(input.compatibilityMatrix, qualified, "AMBIGUOUS_COMPOSITION");
  },
};
