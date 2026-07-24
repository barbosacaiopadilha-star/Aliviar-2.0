"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { hasCrmPermission } from "@/modules/crm/permissions";
import type { CrmActionResult } from "@/modules/crm/types";

import { hasCoaPermission } from "./permissions";
import { recordCoaTransfer, type RecordCoaTransferInput } from "./transfers";

function revalidateCoa(contactId?: string) {
  revalidatePath("/coa/atendimento");
  revalidatePath("/coa/concierge");
  revalidatePath("/coa/curadoria");
  revalidatePath("/admin/crm");
  if (contactId) revalidatePath(`/admin/crm/contatos/${contactId}`);
}

export async function transferToCuradoriaAction(
  input: Omit<RecordCoaTransferInput, "from" | "to" | "toStage"> & {
    curatorId: string;
    curatorName: string;
  },
): Promise<CrmActionResult> {
  try {
    const state = await requireAnyRoleForAction(["administrador", "concierge"]);
    if (
      !hasCoaPermission(state.roles, "coa.transfer_to_curadoria") ||
      !hasCrmPermission(state.roles, "crm.refer_to_curator")
    ) {
      return { success: false, error: "Não autorizado." };
    }

    const supabase = await createServerSupabaseClient();
    await recordCoaTransfer(
      supabase,
      {
        ...input,
        from: "ATENDIMENTO",
        to: "CURADORIA",
        toStage: "sent_to_curator",
        responsibleId: input.curatorId,
        responsibleName: input.curatorName,
      },
      state.user.id,
      state.roles,
    );

    revalidateCoa(input.contactId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível transferir para Curadoria.",
    };
  }
}

export async function transferToConciergeAction(
  input: Omit<RecordCoaTransferInput, "from" | "to" | "toStage"> & {
    conciergeId: string;
    conciergeName: string;
  },
): Promise<CrmActionResult> {
  try {
    const state = await requireAnyRoleForAction(["administrador", "concierge", "curador_medico"]);
    if (!hasCoaPermission(state.roles, "coa.transfer_to_concierge")) {
      return { success: false, error: "Não autorizado." };
    }

    const supabase = await createServerSupabaseClient();
    await recordCoaTransfer(
      supabase,
      {
        ...input,
        from: "CURADORIA",
        to: "CONCIERGE",
        toStage: "scheduling_support",
        responsibleId: input.conciergeId,
        responsibleName: input.conciergeName,
      },
      state.user.id,
      state.roles,
    );

    revalidateCoa(input.contactId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível transferir para Concierge.",
    };
  }
}
