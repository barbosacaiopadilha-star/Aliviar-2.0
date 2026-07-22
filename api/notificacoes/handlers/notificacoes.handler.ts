import { randomUUID } from "crypto";

import { journeyNotificationService } from "@/infrastructure/notifications/journey-notification-service";
import type { JourneyNotificationType } from "@/notification-flow/contracts/journey-notification";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { mapValidationToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse, successResponse } from "api/shared/http/response";

function patientErrorResponse(status: number, code: string, message: string): Response {
  return errorResponse(status, {
    error: { code, message, traceId: randomUUID() },
  });
}

async function requirePatient() {
  const access = await resolvePatientAccess();
  if (access.status === "unauthenticated" || access.status === "session_invalid") {
    return { ok: false as const, response: patientErrorResponse(401, "UNAUTHORIZED", "Sessão inválida ou expirada.") };
  }
  if (access.status === "not_patient") {
    return { ok: false as const, response: patientErrorResponse(403, "FORBIDDEN", "Acesso restrito a pacientes.") };
  }
  return { ok: true as const, patientId: access.patientId };
}

export async function handleListarNotificacoes(searchParams: URLSearchParams): Promise<Response> {
  const access = await requirePatient();
  if (!access.ok) return access.response;

  const tipo = searchParams.get("tipo") as JourneyNotificationType | null;
  const lidaParam = searchParams.get("lida");
  const q = searchParams.get("q") ?? undefined;

  const filter = {
    tipo: tipo ?? undefined,
    lida: lidaParam === null ? undefined : lidaParam === "true",
    q,
  };

  const notificacoes = await journeyNotificationService.listar(access.patientId, filter);
  return successResponse(notificacoes);
}

export async function handleMarcarNotificacaoLida(notificationId: string, body: unknown): Promise<Response> {
  const access = await requirePatient();
  if (!access.ok) return access.response;

  const request = body as { lida?: boolean };
  if (request.lida !== undefined && request.lida !== true) {
    const mapped = mapValidationToApiResponse("Apenas marcar como lida é suportado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const notificacao = await journeyNotificationService.marcarComoLida(access.patientId, notificationId);
  return successResponse(notificacao);
}

export async function handleObterPreferencias(): Promise<Response> {
  const access = await requirePatient();
  if (!access.ok) return access.response;
  return successResponse(await journeyNotificationService.obterPreferencias(access.patientId));
}

export async function handleSalvarPreferencias(body: unknown): Promise<Response> {
  const access = await requirePatient();
  if (!access.ok) return access.response;

  const request = body as {
    receber_email?: boolean;
    receber_whatsapp?: boolean;
    somente_plataforma?: boolean;
  };

  if (
    request.receber_email === undefined ||
    request.receber_whatsapp === undefined ||
    request.somente_plataforma === undefined
  ) {
    const mapped = mapValidationToApiResponse(
      "receber_email, receber_whatsapp e somente_plataforma são obrigatórios.",
    );
    return errorResponse(mapped.status, mapped.body);
  }

  const preferencias = await journeyNotificationService.salvarPreferencias(access.patientId, {
    receber_email: request.receber_email,
    receber_whatsapp: request.receber_whatsapp,
    somente_plataforma: request.somente_plataforma,
  });

  return successResponse(preferencias);
}
