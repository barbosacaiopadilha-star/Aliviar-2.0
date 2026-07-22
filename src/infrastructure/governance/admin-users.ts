import type { AdminUserView, UpdateAdminUserInput } from "@/governance-flow/contracts/admin-view";
import { mapUserRoleToGovernance } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES: UserRole[] = ["ADMIN", "MANAGER", "CURATOR", "OPERATION", "AUDITOR"];

export class AdminUsersService {
  async listar(): Promise<AdminUserView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active, updated_at")
      .in("role", STAFF_ROLES)
      .order("full_name");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      full_name: row.full_name,
      role: row.role,
      governance_role: mapUserRoleToGovernance(row.role as UserRole),
      is_active: row.is_active,
      updated_at: row.updated_at,
    }));
  }

  async atualizar(userId: string, input: UpdateAdminUserInput): Promise<AdminUserView> {
    const supabase = await createClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (input.is_active !== undefined) patch.is_active = input.is_active;
    if (input.role !== undefined) patch.role = input.role;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .in("role", STAFF_ROLES)
      .select("id, full_name, role, is_active, updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "user_not_found");
    }

    return {
      id: data.id,
      full_name: data.full_name,
      role: data.role,
      governance_role: mapUserRoleToGovernance(data.role as UserRole),
      is_active: data.is_active,
      updated_at: data.updated_at,
    };
  }
}

export const adminUsers = new AdminUsersService();
