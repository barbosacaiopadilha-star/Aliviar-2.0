import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  CORRELATION_ID_HEADER,
  correlationIdFromHeaders,
  createCorrelationId,
} from "@/infrastructure/observability/correlation-id";

export const REQUEST_ID_HEADER = "x-request-id";

export interface ApiRequestContext {
  requestId: string;
  correlationId: string;
}

export function createApiRequestContext(request: Request): ApiRequestContext {
  const incomingRequestId = request.headers.get(REQUEST_ID_HEADER);
  const requestId =
    incomingRequestId && incomingRequestId.trim().length > 0 && incomingRequestId.length <= 128
      ? incomingRequestId.trim()
      : randomUUID();

  return {
    requestId,
    correlationId: correlationIdFromHeaders(request.headers),
  };
}

export function withRequestContextHeaders(
  response: Response,
  context: ApiRequestContext,
): Response {
  const headers = new Headers(response.headers);
  headers.set(REQUEST_ID_HEADER, context.requestId);
  headers.set(CORRELATION_ID_HEADER, context.correlationId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withNextResponseContextHeaders(
  response: NextResponse,
  context: ApiRequestContext,
): NextResponse {
  const next = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  next.headers.set(REQUEST_ID_HEADER, context.requestId);
  next.headers.set(CORRELATION_ID_HEADER, context.correlationId);
  return next;
}

export function createApiRequestContextFallback(): ApiRequestContext {
  return {
    requestId: randomUUID(),
    correlationId: createCorrelationId(),
  };
}
