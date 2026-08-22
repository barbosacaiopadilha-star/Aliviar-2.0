"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { CURADORIA_PIPELINE_STAGES } from "@/modules/coa/levels";
import { recordCoaTransfer } from "@/modules/coa/transfers";

import { findPossibleDuplicates } from "./duplicates";
import { canViewContact, hasCrmPermission, CRM_OPERATOR_ROLES } from "./permissions";
import {
  archiveContact,
  changePipelineStage,
  createAppointment,
  createContact,
  createInteraction,
  createTask,
  getCaseById,
  getContactById,
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

async function assertContactAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  contactId: string,
  roles: string[],
  userId: string,
): Promise<void> {
  const { getContactById } = await import("./repository");
  const contact = await getContactById(supabase, contactId);
  if (!contact) throw new Error("Contato não encontrado.");
  if (!canViewContact(roles, contact, userId)) throw new Error("Não autorizado.");
}

function revalidateCrm(contactId?: string) {
  // O funil, tarefas, agenda e os dashboards COA saíram (ADR-075); a ficha
  // CRM fundiu com a do Atendimento (21/08). Sobram a lista, a fila e a
  // ficha única — revalidar rota que não existe era ruído.
  revalidatePath("/admin/crm/contatos");
  revalidatePath("/atendimento");
  if (contactId) revalidatePath(`/atendimento/${contactId}`);
}

async function requireCrmAction(permission?: Parameters<typeof hasCrmPermission>[1]) {
  const state = await requireAnyRoleForAction([...CRM_OPERATOR_ROLES]);
  if (permission && !hasCrmPermission(state.roles, permission)) {
    throw new Error("Não autorizado.");
  }
  return state;
}

export type CreateContactActionResult =
  | { success: true; contactId: string }
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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);
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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);
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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);

    const contactBefore = await getContactById(supabase, parsed.data.contactId);
    await changePipelineStage(supabase, parsed.data, authState.user.id, authState.roles);

    if (
      parsed.data.toStage === "doctor_selected" &&
      contactBefore &&
      CURADORIA_PIPELINE_STAGES.includes(contactBefore.pipelineStage)
    ) {
      const activeCase = contactBefore.activeCaseId
        ? await getCaseById(supabase, contactBefore.activeCaseId)
        : null;
      const conciergeId =
        activeCase?.responsibleConciergeId ?? contactBefore.assignedTo ?? authState.user.id;
      const conciergeName =
        activeCase?.responsibleConciergeName ?? contactBefore.assignedToName ?? "Equipe Aliviar";

      await recordCoaTransfer(
        supabase,
        {
          contactId: parsed.data.contactId,
          caseId: parsed.data.caseId ?? contactBefore.activeCaseId ?? undefined,
          from: "CURADORIA",
          to: "CONCIERGE",
          toStage: "doctor_selected",
          reason: "Assistido escolheu profissional — transferência automática para Concierge.",
          responsibleId: conciergeId,
          responsibleName: conciergeName,
        },
        authState.user.id,
        authState.roles,
        { skipStageChange: true },
      );

      await supabase
        .from("crm_contacts")
        .update({ assigned_to: conciergeId })
        .eq("id", parsed.data.contactId);
    }

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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);
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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);
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
    const { data: taskRow } = await supabase.from("crm_tasks").select("contact_id").eq("id", parsed.data.taskId).maybeSingle();
    if (!taskRow?.contact_id) return { success: false, error: "Tarefa não encontrada." };
    await assertContactAccess(supabase, taskRow.contact_id as string, authState.roles, authState.user.id);
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
    await assertContactAccess(supabase, parsed.data.contactId, authState.roles, authState.user.id);
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
    const { data: appointmentRow } = await supabase
      .from("crm_appointments")
      .select("contact_id")
      .eq("id", parsed.data.appointmentId)
      .maybeSingle();
    if (!appointmentRow?.contact_id) return { success: false, error: "Compromisso não encontrado." };
    await assertContactAccess(supabase, appointmentRow.contact_id as string, authState.roles, authState.user.id);
    await updateAppointment(supabase, parsed.data, authState.user.id);
    revalidateCrm();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar o compromisso." };
  }
}
