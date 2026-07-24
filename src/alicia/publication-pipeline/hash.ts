import { createHash } from "node:crypto";

import type { PublicCatalogRecord } from "./types";

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return Object.keys(item as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (item as Record<string, unknown>)[key];
          return acc;
        }, {});
    }
    return item;
  });
}

export function hashPayload(payload: PublicCatalogRecord): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function buildIdempotencyKey(input: {
  candidateId: string;
  protocolDecisionId: string;
  protocolVersion: string;
  contentHash: string;
}): string {
  return createHash("sha256")
    .update(
      stableStringify({
        candidateId: input.candidateId,
        protocolDecisionId: input.protocolDecisionId,
        protocolVersion: input.protocolVersion,
        contentHash: input.contentHash,
      }),
    )
    .digest("hex");
}
