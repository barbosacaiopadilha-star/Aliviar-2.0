import { randomUUID } from "crypto";

import {
  qualityFeedbackService,
  qualityIncidentService,
  qualityPanelService,
} from "@/infrastructure/quality/quality-service";
import type { IncidentCategory, IncidentSeverity, IncidentStatus } from "@/quality-flow/contracts/operational-quality";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import { requireGovernancePermission } from "@/lib/auth/rbac";
import { mapValidationToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse, successResponse } from "api/shared/http/response";

function patientError(status: number, code: string, message: string) {
  return errorResponse(status, { error: { code, message, traceId: randomUUID() } });
}

async function requirePatient() {
  const access = await resolvePatientAccess();
  if (access.status === "unauthenticated" || access.status === "session_invalid") {
    return { ok: false as const, response: patientError(401, "UNAUTHORIZED", "Sessão inválida.") };
  }
  if (access.status === "not_patient") {
    return { ok: false as const, response: patientError(403, "FORBIDDEN", "Acesso restrito a pacientes.") };
  }
  return { ok: true as const, patientId: access.patientId };
}

async function requireCurator() {
  const access = await resolveStaffAccess();
  if (access.status !== "active_staff") {
    const mapped = mapValidationToApiResponse("Acesso restrito a equipe ativa.");
    return { ok: false as const, response: errorResponse(mapped.status, mapped.body) };
  }
  return { ok: true as const, curatorId: access.profile.id };
}

async function denyGovernance(access: { ok: false; status: number; message: string }) {
  const mapped = mapValidationToApiResponse(access.message);
  return errorResponse(access.status, mapped.body);
}

export async function handleRegistrarFeedbackPaciente(body: unknown): Promise<Response> {
  const access = await requirePatient();
  if (!access.ok) return access.response;

  const request = body as {
    jornada_id?: string;
    satisfacao_geral?: number;
    clareza_informacoes?: number;
    facilidade_uso?: number;
    comentarios?: string;
  };

  if (
    !request.jornada_id ||
    request.satisfacao_geral === undefined ||
    request.clareza_informacoes === undefined ||
    request.facilidade_uso === undefined
  ) {
    const mapped = mapValidationToApiResponse("Campos obrigatórios ausentes.");
    return errorResponse(mapped.status, mapped.body);
  }

  const feedback = await qualityFeedbackService.registrarFeedbackPaciente(access.patientId, {
    jornada_id: request.jornada_id,
    satisfacao_geral: request.satisfacao_geral,
    clareza_informacoes: request.clareza_informacoes,
    facilidade_uso: request.facilidade_uso,
    comentarios: request.comentarios,
  });

  return successResponse(feedback, 201);
}

export async function handleRegistrarFeedbackCurador(body: unknown): Promise<Response> {
  const access = await requireCurator();
  if (!access.ok) return access.response;

  const request = body as {
    jornada_id?: string;
    dificuldades?: string;
    informacoes_ausentes?: string;
    sugestoes?: string;
    problemas_operacionais?: string;
  };

  if (!request.jornada_id) {
    const mapped = mapValidationToApiResponse("jornada_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  try {
    const feedback = await qualityFeedbackService.registrarFeedbackCurador(access.curatorId, {
      jornada_id: request.jornada_id,
      dificuldades: request.dificuldades,
      informacoes_ausentes: request.informacoes_ausentes,
      sugestoes: request.sugestoes,
      problemas_operacionais: request.problemas_operacionais,
    });
    return successResponse(feedback, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "feedback_curador_vazio") {
      const mapped = mapValidationToApiResponse("Informe ao menos um campo de feedback.");
      return errorResponse(mapped.status, mapped.body);
    }
    throw error;
  }
}

export async function handleObterPainelQualidade(): Promise<Response> {
  const access = await requireGovernancePermission("admin.quality.read");
  if (!access.ok) return denyGovernance(access);
  return successResponse(await qualityPanelService.obterPainel());
}

export async function handleObterIndicadoresQualidade(): Promise<Response> {
  const access = await requireGovernancePermission("admin.quality.read");
  if (!access.ok) return denyGovernance(access);
  return successResponse(await qualityPanelService.obterIndicadores());
}

export async function handleCriarIncidente(body: unknown): Promise<Response> {
  const access = await requireGovernancePermission("admin.quality.write");
  if (!access.ok) return denyGovernance(access);

  const request = body as {
    jornada_id?: string;
    categoria?: IncidentCategory;
    severidade?: IncidentSeverity;
    descricao?: string;
    responsavel_id?: string | null;
  };

  if (!request.jornada_id || !request.categoria || !request.severidade || !request.descricao?.trim()) {
    const mapped = mapValidationToApiResponse("jornada_id, categoria, severidade e descricao são obrigatórios.");
    return errorResponse(mapped.status, mapped.body);
  }

  const incidente = await qualityIncidentService.criarIncidente(access.actorId, {
    jornada_id: request.jornada_id,
    categoria: request.categoria,
    severidade: request.severidade,
    descricao: request.descricao,
    responsavel_id: request.responsavel_id,
  });

  return successResponse(incidente, 201);
}

export async function handleAtualizarIncidente(incidentId: string, body: unknown): Promise<Response> {
  const access = await requireGovernancePermission("admin.quality.write");
  if (!access.ok) return denyGovernance(access);

  const request = body as {
    status?: IncidentStatus;
    responsavel_id?: string | null;
    nota?: string;
  };

  const incidente = await qualityIncidentService.atualizarIncidente(access.actorId, incidentId, request);
  return successResponse(incidente);
}

export async function handleListarEventosIncidente(incidentId: string): Promise<Response> {
  const access = await requireGovernancePermission("admin.quality.read");
  if (!access.ok) return denyGovernance(access);
  return successResponse(await qualityIncidentService.listarEventos(incidentId));
}
