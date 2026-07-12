"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { grantRole, revokeRole } from "./repository";
import { teamRoleActionSchema } from "./schema";
import type { TeamActionResult } from "./types";

export async function grantTeamRoleAction(input: unknown): Promise<TeamActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = teamRoleActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const regularClient = await createServerSupabaseClient();

  try {
    await grantRole(regularClient, parsed.data.profileId, parsed.data.roleSlug, authState.user.id);
  } catch {
    return { success: false, error: "Não foi possível conceder o papel agora. Tente novamente." };
  }

  revalidatePath("/admin/equipe");
  return { success: true };
}

export async function revokeTeamRoleAction(input: unknown): Promise<TeamActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = teamRoleActionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  if (parsed.data.roleSlug === "administrador" && parsed.data.profileId === authState.user.id) {
    return { success: false, error: "Você não pode revogar seu próprio papel de administrador." };
  }

  const regularClient = await createServerSupabaseClient();

  try {
    await revokeRole(regularClient, parsed.data.profileId, parsed.data.roleSlug);
  } catch {
    return { success: false, error: "Não foi possível revogar o papel agora. Tente novamente." };
  }

  revalidatePath("/admin/equipe");
  return { success: true };
}
