import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  createApiRequestContext,
  withNextResponseContextHeaders,
  type ApiRequestContext,
} from "@/lib/production/api-request-context";
import { logApiRequest } from "@/lib/production/log-api-request";
import {
  CuratorWorkspaceAccessError,
  getCuratorWorkspaceRuntime,
} from "@/infrastructure/persistence/curator-workspace-runtime";
import {
  getPatientPortalRuntime,
  PatientPortalAccessError,
} from "@/infrastructure/persistence/patient-portal-runtime";
import { getReportReadingRuntime } from "@/infrastructure/persistence/report-reading-runtime";

function accessStatus(code: PatientPortalAccessError["code"] | CuratorWorkspaceAccessError["code"]): number {
  if (code === "UNAUTHORIZED") return 401;
  if (code === "FORBIDDEN") return 403;
  return 404;
}

export function jsonRouteError(
  context: ApiRequestContext,
  status: number,
  message: string,
  code = "REQUEST_FAILED",
): NextResponse {
  return withNextResponseContextHeaders(
    NextResponse.json(
      { error: { code, message, traceId: context.requestId || randomUUID() } },
      { status },
    ),
    context,
  );
}

export function jsonRouteMessage(
  context: ApiRequestContext,
  status: number,
  message: string,
): NextResponse {
  return withNextResponseContextHeaders(NextResponse.json({ message }, { status }), context);
}

export function jsonRouteData<T>(context: ApiRequestContext, status: number, data: T): NextResponse {
  return withNextResponseContextHeaders(NextResponse.json(data, { status }), context);
}

export async function runPatientPortalRoute(
  request: Request,
  input: {
    operation: string;
    handler: (context: ApiRequestContext, runtime: Awaited<ReturnType<typeof getPatientPortalRuntime>>) => Promise<NextResponse>;
  },
): Promise<NextResponse> {
  const started = performance.now();
  const context = createApiRequestContext(request);

  try {
    const runtime = await getPatientPortalRuntime();
    const response = await input.handler(context, runtime);
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: false,
    });
    return withNextResponseContextHeaders(response, context);
  } catch (error) {
    if (error instanceof PatientPortalAccessError) {
      const response = jsonRouteError(context, accessStatus(error.code), error.message, error.code);
      logApiRequest({
        context,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        operation: input.operation,
        demoMode: false,
        errorCode: error.code,
      });
      return response;
    }

    const message = error instanceof Error ? error.message : "Erro interno.";
    const response = jsonRouteError(context, 500, message, "INTERNAL_ERROR");
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: 500,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: false,
      errorCode: "INTERNAL_ERROR",
    });
    return response;
  }
}

export async function runCuratorWorkspaceRoute(
  request: Request,
  journeyId: string,
  input: {
    operation: string;
    handler: (
      context: ApiRequestContext,
      runtime: Awaited<ReturnType<typeof getCuratorWorkspaceRuntime>>,
    ) => Promise<NextResponse>;
  },
): Promise<NextResponse> {
  const started = performance.now();
  const context = createApiRequestContext(request);

  try {
    const runtime = await getCuratorWorkspaceRuntime(journeyId);
    const response = await input.handler(context, runtime);
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: false,
    });
    return withNextResponseContextHeaders(response, context);
  } catch (error) {
    if (error instanceof CuratorWorkspaceAccessError) {
      const response = jsonRouteError(context, accessStatus(error.code), error.message, error.code);
      logApiRequest({
        context,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        operation: input.operation,
        demoMode: false,
        errorCode: error.code,
      });
      return response;
    }

    const message = error instanceof Error ? error.message : "Erro interno.";
    return jsonRouteError(context, 500, message, "INTERNAL_ERROR");
  }
}

export async function runReportReadingRoute(
  request: Request,
  input: {
    operation: string;
    handler: (context: ApiRequestContext, runtime: Awaited<ReturnType<typeof getReportReadingRuntime>>) => Promise<NextResponse>;
  },
): Promise<NextResponse> {
  const started = performance.now();
  const context = createApiRequestContext(request);

  try {
    const runtime = await getReportReadingRuntime();
    const response = await input.handler(context, runtime);
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: false,
    });
    return withNextResponseContextHeaders(response, context);
  } catch (error) {
    if (error instanceof PatientPortalAccessError) {
      return jsonRouteError(context, accessStatus(error.code), error.message, error.code);
    }

    const message = error instanceof Error ? error.message : "Erro interno.";
    return jsonRouteError(context, 500, message, "INTERNAL_ERROR");
  }
}
