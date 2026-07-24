"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import { findPossibleDuplicates } from "./duplicates";
import { hasCrmPermission } from "./permissions";
import {
  archiveContact,
  changePipelineStage,
  createAppointment,
  createContact,
  createInteraction,
  createTask,
  listContacts,
  updateAppointment,
  updateContact,
  updateTaskStatus,
} from "./repository";
import {
  archiveContactInputSchema,
  changePipelineStageInputSchema,
  createAppointmentInputSchema,
  createContactInputSchema,
  createInteractionInputSchema,
  createTaskInputSchema,
  updateAppointmentInputSchema,
  updateContactInputSchema,
  updateTaskStatusInputSchema,
} from "./schema";
import type { CrmActionResult } from "./types";
import { CRM_ACCESS_ROLES } from "./permissions";

function revalidateCrm(contactId?: string) {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/contatos");
  revalidatePath("/admin/crm/funil");
  revalidatePath("/admin/crm/tarefas");
  revalidatePath("/admin/crm/agenda");
  if (contactId) revalidatePath(`/admin/crm/contatos/${contactId}`);
}

async function requireCrmAction(permission?: Parameters<typeof hasCrmPermission>[1]) {
  const state = await requireAnyRoleForAction([...CRM_ACCESS_ROLES]);
  if (permission && !hasCrmPermission(state.roles, permission)) {
    throw new Error("Não autorizado.");
  }
  return state;
}

export type CreateContactActionResult =
  | { success: true; contactId: string; caseId: string }
  | { success: false; error: string; duplicates?: ReturnType<typeof findPossibleDuplicates> };

export async function createContactAction(input: unknown): Promise<CreateContactActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.create_contact");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createContactInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    if (!parsed.data.acknowledgeDuplicates) {
      const contacts = await listContacts(supabase);
      const duplicates = findPossibleDuplicates(contacts, {
        phone: parsed.data.phone,
        email: parsed.data.email,
      });
      if (duplicates.length > 0) {
        return { success: false, error: "Possíveis duplicidades encontradas.", duplicates };
      }
    }

    const created = await createContact(supabase, parsed.data, authState.user.id);
    revalidateCrm(created.contactId);
    return { success: true, ...created };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível criar o contato." };
  }
}

export async function updateContactAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.edit_contact");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = updateContactInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await updateContact(supabase, parsed.data, authState.user.id);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o contato." };
  }
}

export async function archiveContactAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.archive_contact");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = archiveContactInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await archiveContact(supabase, parsed.data.contactId, authState.user.id, parsed.data.reason);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível arquivar o contato." };
  }
}

export async function changePipelineStageAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.change_stage");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = changePipelineStageInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await changePipelineStage(supabase, parsed.data, authState.user.id, authState.roles);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível mudar a etapa." };
  }
}

export async function createInteractionAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.edit_contact");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createInteractionInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await createInteraction(supabase, parsed.data, authState.user.id);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível registrar a interação." };
  }
}

export async function createTaskAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.manage_tasks");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createTaskInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await createTask(supabase, parsed.data, authState.user.id);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível criar a tarefa." };
  }
}

export async function updateTaskStatusAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.manage_tasks");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = updateTaskStatusInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await updateTaskStatus(supabase, parsed.data.taskId, parsed.data.status, authState.user.id);
    revalidateCrm();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar a tarefa." };
  }
}

export async function createAppointmentAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.manage_appointments");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createAppointmentInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await createAppointment(supabase, parsed.data, authState.user.id);
    revalidateCrm(parsed.data.contactId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível criar o compromisso." };
  }
}

export async function updateAppointmentAction(input: unknown): Promise<CrmActionResult> {
  let authState;
  try {
    authState = await requireCrmAction("crm.manage_appointments");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = updateAppointmentInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const supabase = await createServerSupabaseClient();
    await updateAppointment(supabase, parsed.data, authState.user.id);
    revalidateCrm();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o compromisso." };
  }
}
