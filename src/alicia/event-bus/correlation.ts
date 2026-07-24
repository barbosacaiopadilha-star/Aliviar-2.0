import { createHash } from "node:crypto";

const correlationRegistry = new Map<string, string>();

export function createCorrelationId(candidateId: string, seed?: string): string {
  const base = seed ?? `${candidateId}-${Date.now()}`;
  const correlationId = `corr-${createHash("sha256").update(base).digest("hex").slice(0, 16)}`;
  correlationRegistry.set(candidateId, correlationId);
  return correlationId;
}

export function getCorrelationId(candidateId: string): string | undefined {
  return correlationRegistry.get(candidateId);
}

export function resolveCorrelationId(candidateId: string, fallback?: string): string {
  return getCorrelationId(candidateId) ?? createCorrelationId(candidateId, fallback);
}

export function resetCorrelationRegistry(): void {
  correlationRegistry.clear();
}
