"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import {
  archiveLeadAdminInputSchema,
  deleteLeadAdminInputSchema,
  restoreLeadAdminInputSchema,
} from "./schema";

export type AdminLeadActionResult =
  { success: true } | { success: false; error: string };

async function requireAdministrator() {
  try {
    await requireAnyRoleForAction(["administrador"]);
    return true;
  } catch {
    return false;
  }
}

function revalidateLeadSurfaces(leadId: string) {
  revalidatePath("/admin");
  revalidatePath("/atendimento");
  revalidatePath(`/atendimento/${leadId}`);
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/contatos");
  revalidatePath(`/admin/crm/contatos/${leadId}`);
}

export async function archiveLeadAdminAction(
  input: unknown,
): Promise<AdminLeadActionResult> {
  if (!(await requireAdministrator()))
    return { success: false, error: "Não autorizado." };

  const parsed = archiveLeadAdminInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.schema("curadoria").rpc("archive_lead", {
    _contact_id: parsed.data.leadId,
    _reason: parsed.data.reason,
  });

  if (error) return { success: false, error: error.message };
  revalidateLeadSurfaces(parsed.data.leadId);
  return { success: true };
}

export async function restoreLeadAdminAction(
  input: unknown,
): Promise<AdminLeadActionResult> {
  if (!(await requireAdministrator()))
    return { success: false, error: "Não autorizado." };

  const parsed = restoreLeadAdminInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.schema("curadoria").rpc("restore_lead", {
    _contact_id: parsed.data.leadId,
    _reason: parsed.data.reason,
  });

  if (error) return { success: false, error: error.message };
  revalidateLeadSurfaces(parsed.data.leadId);
  return { success: true };
}

export async function deleteLeadAdminAction(
  input: unknown,
): Promise<AdminLeadActionResult> {
  if (!(await requireAdministrator()))
    return { success: false, error: "Não autorizado." };

  const parsed = deleteLeadAdminInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .schema("curadoria")
    .rpc("delete_lead_permanently", {
      _contact_id: parsed.data.leadId,
      _reason: parsed.data.reason,
      _confirmation: parsed.data.confirmation,
    });

  if (error) return { success: false, error: error.message };
  revalidateLeadSurfaces(parsed.data.leadId);
  return { success: true };
}
