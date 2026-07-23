import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  createApiRequestContext,
  withNextResponseContextHeaders,
  type ApiRequestContext,
} from "@/lib/production/api-request-context";
import {
  assertDemoRuntimeAllowed,
  DemoRuntimeDisabledError,
  type DemoModeFlag,
  isCuratorDemoMode,
  isPatientDemoMode,
  isReportDemoMode,
} from "@/lib/production/demo-mode-flags";
import { logApiRequest } from "@/lib/production/log-api-request";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";

function productionError(
  status: number,
  code: string,
  message: string,
  context: ApiRequestContext,
): NextResponse {
  const body = {
    error: {
      code,
      message,
      traceId: context.requestId,
    },
  };
  return withNextResponseContextHeaders(NextResponse.json(body, { status }), context);
}

export function mapDemoRuntimeError(
  error: unknown,
  context: ApiRequestContext,
): NextResponse | null {
  if (error instanceof DemoRuntimeDisabledError) {
    return productionError(403, error.code, error.message, context);
  }
  return null;
}

async function denyWithoutPatientAuth(context: ApiRequestContext): Promise<NextResponse> {
  const access = await resolvePatientAccess();

  if (access.status === "unauthenticated") {
    return productionError(401, "UNAUTHORIZED", "Autenticação necessária.", context);
  }

  if (access.status === "session_invalid") {
    return productionError(401, "SESSION_INVALID", "Sessão inválida ou expirada.", context);
  }

  if (access.status === "not_patient") {
    return productionError(403, "FORBIDDEN", "Acesso restrito a pacientes.", context);
  }

  return productionError(
    503,
    "PRODUCTION_PERSISTENCE_REQUIRED",
    "Endpoint do portal requer persistência real. Demo mode está desabilitado.",
    context,
  );
}

async function denyWithoutCuratorAuth(context: ApiRequestContext): Promise<NextResponse> {
  const access = await resolveStaffAccess();

  if (access.status === "unauthenticated") {
    return productionError(401, "UNAUTHORIZED", "Autenticação necessária.", context);
  }

  if (access.status === "session_invalid") {
    return productionError(401, "SESSION_INVALID", "Sessão inválida ou expirada.", context);
  }

  if (access.status !== "active_staff") {
    return productionError(403, "FORBIDDEN", "Acesso restrito a equipe ativa.", context);
  }

  return productionError(
    503,
    "PRODUCTION_PERSISTENCE_REQUIRED",
    "Workspace do curador requer persistência real. Demo mode está desabilitado.",
    context,
  );
}

export async function guardPatientDemoAccess(
  request: Request,
): Promise<{ context: ApiRequestContext; denied: NextResponse | null }> {
  const context = createApiRequestContext(request);

  if (isPatientDemoMode()) {
    return { context, denied: null };
  }

  return { context, denied: await denyWithoutPatientAuth(context) };
}

export async function guardCuratorDemoAccess(
  request: Request,
): Promise<{ context: ApiRequestContext; denied: NextResponse | null }> {
  const context = createApiRequestContext(request);

  if (isCuratorDemoMode()) {
    return { context, denied: null };
  }

  return { context, denied: await denyWithoutCuratorAuth(context) };
}

export async function guardReportDemoAccess(
  request: Request,
): Promise<{ context: ApiRequestContext; denied: NextResponse | null }> {
  const context = createApiRequestContext(request);

  if (isReportDemoMode()) {
    return { context, denied: null };
  }

  return { context, denied: await denyWithoutPatientAuth(context) };
}

export async function runGuardedDemoRoute(
  request: Request,
  input: {
    operation: string;
    flag: DemoModeFlag;
    guard: (request: Request) => Promise<{ context: ApiRequestContext; denied: NextResponse | null }>;
    handler: (context: ApiRequestContext) => Promise<NextResponse>;
  },
): Promise<NextResponse> {
  const started = performance.now();
  const { context, denied } = await input.guard(request);

  if (denied) {
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: denied.status,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: false,
      errorCode: "DEMO_DISABLED",
    });
    return denied;
  }

  try {
    assertDemoRuntimeAllowed(input.flag);
    const response = await input.handler(context);
    const wrapped = withNextResponseContextHeaders(response, context);
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: wrapped.status,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: true,
    });
    return wrapped;
  } catch (error) {
    const mapped = mapDemoRuntimeError(error, context);
    if (mapped) {
      logApiRequest({
        context,
        method: request.method,
        path: new URL(request.url).pathname,
        status: mapped.status,
        durationMs: Math.round(performance.now() - started),
        operation: input.operation,
        demoMode: false,
        errorCode: "DEMO_RUNTIME_DISABLED",
      });
      return mapped;
    }

    const message = error instanceof Error ? error.message : "Erro interno.";
    const response = productionError(500, "INTERNAL_ERROR", message, context);
    logApiRequest({
      context,
      method: request.method,
      path: new URL(request.url).pathname,
      status: 500,
      durationMs: Math.round(performance.now() - started),
      operation: input.operation,
      demoMode: true,
      errorCode: "INTERNAL_ERROR",
    });
    return response;
  }
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
