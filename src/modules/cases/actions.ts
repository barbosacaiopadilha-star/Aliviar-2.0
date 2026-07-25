"use server";


import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction, requireRoleForAction } from "@/modules/auth/guard";

import { addCaseNote, changeCaseStatus, createCase, reassignCurator } from "./repository";
import {
  addCaseNoteInputSchema,
  changeCaseStatusInputSchema,
  createCaseInputSchema,
  reassignCuratorInputSchema,
} from "./schema";
import { revalidateCaseSurfaces } from "./revalidate";
import type { CaseActionResult, CaseNote } from "./types";

export type CreateCaseActionResult = { success: true; caseId: string } | { success: false; error: string };

export async function createCaseAction(input: unknown): Promise<CreateCaseActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = createCaseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const created = await createCase(supabase, parsed.data.storyId, parsed.data.assignedCuratorId, authState.user.id);
    revalidateCaseSurfaces(created.id);
    return { success: true, caseId: created.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível criar o caso." };
  }
}

// Só administrador reatribui — gestão de carga de trabalho é uma decisão
// operacional centralizada nesta sprint (ADR-019); o próprio curador não
// transfere um caso para outro colega por conta própria.
export async function reassignCuratorAction(input: unknown): Promise<CaseActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = reassignCuratorInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await reassignCurator(supabase, parsed.data.caseId, parsed.data.newCuratorId, authState.user.id, parsed.data.reason);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível reatribuir o caso." };
  }

  revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true };
}

export async function changeCaseStatusAction(input: unknown): Promise<CaseActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = changeCaseStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await changeCaseStatus(supabase, parsed.data.caseId, parsed.data.nextStatus, authState.user.id);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível mudar o status." };
  }

  revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true };
}

export type AddCaseNoteActionResult = { success: true; note: CaseNote } | { success: false; error: string };

// Sempre acrescenta uma nota nova — nunca edita ou apaga uma anterior
// (ajuste pós-Sprint 2: histórico append-only).
export async function addCaseNoteAction(input: unknown): Promise<AddCaseNoteActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = addCaseNoteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const note = await addCaseNote(supabase, parsed.data.caseId, parsed.data.body, authState.user.id);
    revalidateCaseSurfaces(parsed.data.caseId);
    return { success: true, note };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível salvar a nota." };
  }
}
