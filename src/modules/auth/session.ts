import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthState = {
  user: User;
  profile: AuthProfile | null;
  roles: string[];
};

type UserRoleRow = {
  roles: { slug: string } | { slug: string }[] | null;
};

function extractRoleSlugs(rows: UserRoleRow[]): string[] {
  return rows
    .flatMap((row) => (Array.isArray(row.roles) ? row.roles : [row.roles]))
    .filter((role): role is { slug: string } => role !== null)
    .map((role) => role.slug);
}

/**
 * Resolve o estado de acesso da sessão atual: usuário autenticado (se houver),
 * o perfil sincronizado por public.handle_new_user (TASK-003) e os papéis
 * concedidos em public.user_roles. Retorna null se não houver sessão válida.
 */
export async function getAuthState(): Promise<AuthState | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(slug)")
    .eq("profile_id", user.id);

  return {
    user,
    profile: profileRow
      ? {
          id: profileRow.id,
          displayName: profileRow.display_name,
          avatarUrl: profileRow.avatar_url,
        }
      : null,
    roles: extractRoleSlugs((roleRows ?? []) as UserRoleRow[]),
  };
}
