import { recordOperationalAudit } from "api/shared/observability/instrument-operation";
import { mapValidationToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse, successResponse } from "api/shared/http/response";
import { requireGovernancePermission } from "@/lib/auth/rbac";
import { buildPermissionMatrixView } from "@/lib/auth/rbac";
import { systemConfiguration } from "@/infrastructure/governance/system-configuration";
import { featureFlags } from "@/infrastructure/governance/feature-flags";
import { adminUsers } from "@/infrastructure/governance/admin-users";
import { auditQuery } from "@/infrastructure/governance/audit-query";
import { runOperationalHealthChecks } from "@/infrastructure/observability/health-check";
import type { AuditSearchFilters } from "@/governance-flow/contracts/admin-view";

async function deny(access: { ok: false; status: number; message: string }) {
  const mapped = mapValidationToApiResponse(access.message);
  return errorResponse(access.status, mapped.body);
}

export async function handleObterConfiguracao(): Promise<Response> {
  const access = await requireGovernancePermission("admin.config.read");
  if (!access.ok) return deny(access);

  const snapshot = await systemConfiguration.obterSnapshot();
  return successResponse(snapshot);
}

export async function handleAtualizarConfiguracao(body: unknown): Promise<Response> {
  const access = await requireGovernancePermission("admin.config.write");
  if (!access.ok) return deny(access);

  const request = body as Record<string, unknown>;
  const partial: Partial<{
    sla_policies: unknown;
    upload_limits: unknown;
    maintenance: unknown;
    global_messages: unknown;
  }> = {};

  if (request.sla_policies !== undefined) partial.sla_policies = request.sla_policies;
  if (request.upload_limits !== undefined) partial.upload_limits = request.upload_limits;
  if (request.maintenance !== undefined) partial.maintenance = request.maintenance;
  if (request.global_messages !== undefined) partial.global_messages = request.global_messages;

  const snapshot = await systemConfiguration.atualizarParcial(partial as never, access.actorId);

  await recordOperationalAudit({
    eventType: "CONFIG_ALTERADA",
    actorId: access.actorId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: { keys: Object.keys(request).join(",") },
  });

  return successResponse(snapshot);
}

export async function handleListarUsuarios(): Promise<Response> {
  const access = await requireGovernancePermission("admin.users.read");
  if (!access.ok) return deny(access);
  return successResponse(await adminUsers.listar());
}

export async function handleAtualizarUsuario(userId: string, body: unknown): Promise<Response> {
  const access = await requireGovernancePermission("admin.users.write");
  if (!access.ok) return deny(access);

  const request = body as { is_active?: boolean; role?: string };
  const updated = await adminUsers.atualizar(userId, request);

  await recordOperationalAudit({
    eventType: "USUARIO_ALTERADO",
    actorId: access.actorId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: {
      target_user_id: userId,
      is_active: request.is_active ?? null,
      role: request.role ?? null,
    },
  });

  return successResponse(updated);
}

export async function handleObterPermissoes(): Promise<Response> {
  const access = await requireGovernancePermission("admin.permissions.read");
  if (!access.ok) return deny(access);
  return successResponse(buildPermissionMatrixView());
}

export async function handleListarFeatureFlags(): Promise<Response> {
  const access = await requireGovernancePermission("admin.flags.read");
  if (!access.ok) return deny(access);
  return successResponse(await featureFlags.listar());
}

export async function handleAtualizarFeatureFlag(key: string, body: unknown): Promise<Response> {
  const access = await requireGovernancePermission("admin.flags.write");
  if (!access.ok) return deny(access);

  const request = body as { enabled?: boolean; rollout_percentage?: number; description?: string };
  const updated = await featureFlags.atualizar(
    key,
    {
      enabled: Boolean(request.enabled),
      rollout_percentage: request.rollout_percentage ?? 0,
      description: request.description,
    },
    access.actorId,
  );

  await recordOperationalAudit({
    eventType: "FEATURE_FLAG_ALTERADA",
    actorId: access.actorId,
    actorRole: "STAFF",
    resultado: "SUCESSO",
    metadata: { flag_key: key, enabled: updated.enabled },
  });

  return successResponse(updated);
}

export async function handleObterSaudePlataforma(): Promise<Response> {
  const access = await requireGovernancePermission("admin.health.read");
  if (!access.ok) return deny(access);
  const report = await runOperationalHealthChecks();
  const status = report.status === "ok" ? 200 : report.status === "degraded" ? 207 : 503;
  return successResponse(report, status);
}

export async function handlePesquisarAuditoria(searchParams: URLSearchParams): Promise<Response> {
  const access = await requireGovernancePermission("admin.audit.read");
  if (!access.ok) return deny(access);

  const filters: AuditSearchFilters = {
    patient_id: searchParams.get("patient_id") ?? undefined,
    jornada_id: searchParams.get("jornada_id") ?? undefined,
    curator_id: searchParams.get("curator_id") ?? undefined,
    event_type: searchParams.get("event_type") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  };

  return successResponse(await auditQuery.pesquisar(filters));
}
