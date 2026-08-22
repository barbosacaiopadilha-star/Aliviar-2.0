import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import type {
  AuditAction,
  AuditLogEntry,
  ManageableRoleSlug,
  TeamMember,
} from "./types";

export type CuratorOption = { id: string; name: string };

/**
 * Lista nominal de quem pode receber um Case. Não consulta o Auth porque a
 * atribuição precisa apenas do papel vigente e do nome; assim não herda o
 * teto de 1.000 usuários nem transforma falha da Admin API em fila vazia.
 */
export async function listCuratorOptions(
  regularClient: SupabaseClient,
): Promise<CuratorOption[]> {
  const { data, error } = await regularClient
    .from("user_roles")
    .select(
      "profile_id, roles!inner(slug), profiles!user_roles_profile_id_fkey(display_name)",
    )
    .eq("roles.slug", "curador_medico");

  if (error) {
    throw erroDeBanco("Não foi possível carregar os Curadores Médicos.", error);
  }

  type EmbeddedProfile =
    { display_name: string | null } | { display_name: string | null }[] | null;
  const unicos = new Map<string, CuratorOption>();
  for (const row of (data ?? []) as unknown as Array<{
    profile_id: string;
    profiles: EmbeddedProfile;
  }>) {
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    // V2 (auditoria 22/08): perfis sem nome caíam todos no rótulo "Curador"
    // e o filtro virava seis opções idênticas. O id curto distingue sem
    // inventar nome — e denuncia o cadastro incompleto, que é o defeito real.
    unicos.set(row.profile_id, {
      id: row.profile_id,
      name: profile?.display_name ?? `Curador sem nome (${row.profile_id.slice(0, 8)})`,
    });
  }

  return [...unicos.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

// Lista todas as pessoas (profiles) com seus papéis atuais + e-mail. A UI
// decide o recorte (equipe interna vs. busca para conceder papel) — este
// repositório só entrega o dado completo, mesmo padrão de
// patient-account-repository.listPatientAccounts.
export async function listTeamMembers(
  regularClient: SupabaseClient,
  adminClient: SupabaseClient,
): Promise<TeamMember[]> {
  const { data: profileRows } = await regularClient
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  const { data: userRoleRows } = await regularClient
    .from("user_roles")
    .select("profile_id, roles(slug)");

  const rolesByProfileId = new Map<string, string[]>();
  for (const row of (userRoleRows ?? []) as Array<{
    profile_id: string;
    roles: { slug: string } | { slug: string }[] | null;
  }>) {
    const slugs = Array.isArray(row.roles)
      ? row.roles
      : row.roles
        ? [row.roles]
        : [];
    const existing = rolesByProfileId.get(row.profile_id) ?? [];
    rolesByProfileId.set(
      row.profile_id,
      existing.concat(slugs.map((role) => role.slug)),
    );
  }

  const { data: usersData } = await adminClient.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailByProfileId = new Map(
    (usersData?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  return (profileRows ?? []).map((profile) => ({
    profileId: profile.id,
    displayName: profile.display_name ?? "Sem nome",
    email: emailByProfileId.get(profile.id) ?? "",
    roles: rolesByProfileId.get(profile.id) ?? [],
  }));
}

export async function grantRole(
  regularClient: SupabaseClient,
  profileId: string,
  roleSlug: ManageableRoleSlug,
  grantedBy: string,
): Promise<void> {
  const { data: roleRow, error: roleLookupError } = await regularClient
    .from("roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();

  if (roleLookupError || !roleRow) {
    throw new Error(`Papel '${roleSlug}' não encontrado no catálogo.`);
  }

  const { error } = await regularClient
    .from("user_roles")
    .insert({
      profile_id: profileId,
      role_id: roleRow.id,
      granted_by: grantedBy,
    });

  if (error) {
    throw erroDeBanco("Não foi possível conceder o papel.", error);
  }
}

export async function revokeRole(
  regularClient: SupabaseClient,
  profileId: string,
  roleSlug: ManageableRoleSlug,
): Promise<void> {
  const { data: roleRow, error: roleLookupError } = await regularClient
    .from("roles")
    .select("id")
    .eq("slug", roleSlug)
    .single();

  if (roleLookupError || !roleRow) {
    throw new Error(`Papel '${roleSlug}' não encontrado no catálogo.`);
  }

  const { error } = await regularClient
    .from("user_roles")
    .delete()
    .eq("profile_id", profileId)
    .eq("role_id", roleRow.id);

  if (error) {
    throw erroDeBanco("Não foi possível revogar o papel.", error);
  }
}

type AuditLogRow = {
  id: number;
  actor_id: string | null;
  action: AuditAction;
  target_profile_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function mapAuditLogRows(
  regularClient: SupabaseClient,
  rows: AuditLogRow[],
): Promise<AuditLogEntry[]> {
  const profileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.actor_id, row.target_profile_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: profileRows } = profileIds.length
    ? await regularClient
        .from("profiles")
        .select("id, display_name")
        .in("id", profileIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> };

  const { data: roleRows } = await regularClient
    .from("roles")
    .select("id, name");
  const nameByRoleId = new Map(
    (roleRows ?? []).map((row) => [row.id as number, row.name as string]),
  );

  const nameByProfileId = new Map(
    (profileRows ?? []).map((row) => [row.id, row.display_name]),
  );

  return rows.map((row) => {
    const roleId = row.metadata?.role_id;
    return {
      id: row.id,
      actorId: row.actor_id,
      actorName: row.actor_id
        ? (nameByProfileId.get(row.actor_id) ?? "Sistema")
        : null,
      action: row.action,
      targetProfileId: row.target_profile_id,
      targetName: row.target_profile_id
        ? (nameByProfileId.get(row.target_profile_id) ?? null)
        : null,
      roleName:
        typeof roleId === "number" ? (nameByRoleId.get(roleId) ?? null) : null,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  });
}

export async function listRecentAuditLogs(
  regularClient: SupabaseClient,
  limit = 10,
): Promise<AuditLogEntry[]> {
  const { data } = await regularClient
    .from("audit_logs")
    .select("id, actor_id, action, target_profile_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return mapAuditLogRows(regularClient, (data ?? []) as AuditLogRow[]);
}

export async function listAuditLogsForProfile(
  regularClient: SupabaseClient,
  profileId: string,
): Promise<AuditLogEntry[]> {
  const { data } = await regularClient
    .from("audit_logs")
    .select("id, actor_id, action, target_profile_id, metadata, created_at")
    .eq("target_profile_id", profileId)
    .order("created_at", { ascending: false });

  return mapAuditLogRows(regularClient, (data ?? []) as AuditLogRow[]);
}
