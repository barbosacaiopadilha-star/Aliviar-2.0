import { randomUUID } from "crypto";

const CORRELATION_HEADER = "x-correlation-id";

export function createCorrelationId(): string {
  return randomUUID();
}

export function resolveCorrelationId(incoming?: string | null): string {
  const trimmed = incoming?.trim();
  if (!trimmed || trimmed.length > 128) {
    return createCorrelationId();
  }
  return trimmed;
}

export function correlationIdFromHeaders(headers: Headers): string {
  return resolveCorrelationId(headers.get(CORRELATION_HEADER));
}

export const CORRELATION_ID_HEADER = CORRELATION_HEADER;

export function maskEntityId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.length <= 8) return "***";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}
