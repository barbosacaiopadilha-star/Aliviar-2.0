import type { SystemConfigurationSnapshot } from "@/governance-flow/contracts/system-configuration";
import type { FeatureFlagView } from "@/governance-flow/contracts/feature-flag";
import type { AdminUserView, AuditSearchResult } from "@/governance-flow/contracts/admin-view";
import type { PermissionMatrixView } from "@/governance-flow/contracts/rbac";
import type { HealthReport } from "@/infrastructure/observability/health-check";

async function parseError(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return new Error(body.error?.message ?? "Operação administrativa falhou.");
  } catch {
    return new Error("Operação administrativa falhou.");
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export async function fetchAdminConfig(): Promise<SystemConfigurationSnapshot> {
  return getJson("/api/v1/admin/configuracao");
}

export async function updateAdminConfig(payload: Partial<SystemConfigurationSnapshot>): Promise<SystemConfigurationSnapshot> {
  const response = await fetch("/api/v1/admin/configuracao", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: SystemConfigurationSnapshot };
  return body.data;
}

export async function fetchAdminUsers(): Promise<AdminUserView[]> {
  return getJson("/api/v1/admin/usuarios");
}

export async function updateAdminUser(
  userId: string,
  payload: { is_active?: boolean; role?: string },
): Promise<AdminUserView> {
  const response = await fetch(`/api/v1/admin/usuarios/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: AdminUserView };
  return body.data;
}

export async function fetchPermissionMatrix(): Promise<PermissionMatrixView> {
  return getJson("/api/v1/admin/permissoes");
}

export async function fetchFeatureFlags(): Promise<FeatureFlagView[]> {
  return getJson("/api/v1/admin/feature-flags");
}

export async function updateFeatureFlag(
  key: string,
  payload: { enabled: boolean; rollout_percentage: number; description?: string },
): Promise<FeatureFlagView> {
  const response = await fetch(`/api/v1/admin/feature-flags/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: FeatureFlagView };
  return body.data;
}

export async function fetchPlatformHealth(): Promise<HealthReport> {
  return getJson("/api/v1/admin/saude");
}

export async function searchAuditTrail(params: Record<string, string>): Promise<AuditSearchResult> {
  const query = new URLSearchParams(params);
  return getJson(`/api/v1/admin/auditoria?${query.toString()}`);
}
