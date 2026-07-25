"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction, requireRoleForAction } from "@/modules/auth/guard";

import { validateSelection } from "./method";
import { computePriorityValidationReadiness } from "./priority-validation-readiness";
import * as repository from "./repository";
import {
  addMandatoryFilterInputSchema,
  addPreferenceInputSchema,
  computeCompatibilityInputSchema,
  deliverSelectionInputSchema,
  registerAcolhimentoInputSchema,
  registerDecisionInputSchema,
  removeFilterInputSchema,
  removeWeightInputSchema,
  savePatientHistoryInputSchema,
  saveAllWeightsInputSchema,
  saveSelectionInputSchema,
  saveWeightInputSchema,
  startConsultationInputSchema,
  validateProfileInputSchema,
} from "./schema";
import type { CuradoriaActionResult } from "./types";

const CURATOR_ROLES = ["administrador", "curador_medico"] as const;

async function requireCurator() {
  return requireAnyRoleForAction([...CURATOR_ROLES]);
}

function fail(error: unknown, fallback: string): CuradoriaActionResult {
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function revalidateCuradoria(caseId: string) {
  revalidatePath(`/curador/casos/${caseId}/curadoria`);
  revalidatePath(`/curador/casos/${caseId}`);
  revalidatePath("/paciente");
  revalidatePath("/paciente/curadoria");
}

// ---------------------------------------------------------------------------
// Consulta Inicial
// ---------------------------------------------------------------------------

export type StartConsultationResult =
  | { success: true; priorityProfileId: string }
  | { success: false; error: string };

export async function startConsultationAction(input: unknown): Promise<StartConsultationResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = startConsultationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    const priorityProfileId = await repository.createPriorityProfile(
      supabase,
      parsed.data.caseId,
      authState.user.id,
    );
    revalidateCuradoria(parsed.data.caseId);
    return { success: true, priorityProfileId };
  } catch (error) {
    return fail(error, "Não foi possível iniciar a Consulta Inicial.") as StartConsultationResult;
  }
}

export async function savePatientHistoryAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = savePatientHistoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await repository.savePatientHistory(supabase, parsed.data.priorityProfileId, parsed.data.patientHistory);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar a história.");
  }
}

// ---------------------------------------------------------------------------
// Filtros e preferências
// ---------------------------------------------------------------------------

export async function addMandatoryFilterAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = addMandatoryFilterInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await repository.addFilter(
      supabase,
      parsed.data.priorityProfileId,
      "FILTRO_OBRIGATORIO",
      parsed.data.kind,
      parsed.data.value,
      parsed.data.note ?? null,
    );
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível adicionar o filtro.");
  }
}

export async function addPreferenceAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = addPreferenceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    // Preferência nunca elimina ninguém — é registrada em texto livre, como o
    // paciente a disse, e informa a conversa do Curador.
    await repository.addFilter(
      supabase,
      parsed.data.priorityProfileId,
      "PREFERENCIA",
      "LIVRE",
      parsed.data.value,
      parsed.data.note ?? null,
    );
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a preferência.");
  }
}

export async function removeFilterAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = removeFilterInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.removeFilter(supabase, parsed.data.filterId);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível remover o item.");
  }
}

// ---------------------------------------------------------------------------
// Pesos
// ---------------------------------------------------------------------------

export async function saveWeightAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveWeightInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await repository.saveWeight(
      supabase,
      parsed.data.priorityProfileId,
      parsed.data.criterion,
      parsed.data.weight,
      parsed.data.targetValue ?? null,
      parsed.data.evidence,
    );
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar o peso.");
  }
}

export async function saveAllWeightsAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveAllWeightsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();
  const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
  if (!profile) return { success: false, error: "Perfil de Prioridades não encontrado." };
  if (profile.validatedAt) {
    return { success: false, error: "Este Perfil já foi validado e não pode ser alterado." };
  }

  try {
    for (const weight of parsed.data.weights) {
      await repository.saveWeight(
        supabase,
        parsed.data.priorityProfileId,
        weight.criterion,
        weight.weight,
        weight.targetValue ?? null,
        weight.evidence,
      );
    }
    revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar os pesos.");
  }
}

export async function removeWeightAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = removeWeightInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.removeWeight(supabase, parsed.data.priorityProfileId, parsed.data.criterion);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível remover o peso.");
  }
}

// ---------------------------------------------------------------------------
// Validação do paciente — o ato que faz o Perfil existir
// ---------------------------------------------------------------------------

export async function validateProfileAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = validateProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
  if (!profile) return { success: false, error: "Perfil de Prioridades não encontrado." };

  if (profile.validatedAt) {
    return { success: false, error: "Este Perfil já foi validado." };
  }

  const readiness = computePriorityValidationReadiness({
    weights: profile.weights.map((weight) => ({
      criterion: weight.criterion,
      weight: weight.weight,
      targetValue: weight.targetValue,
      evidence: weight.evidence,
    })),
    filterCriteria: [],
    validated: Boolean(profile.validatedAt),
  });

  if (!readiness.canValidate) {
    return {
      success: false,
      error: readiness.blockers[0]?.message ?? "O Perfil ainda não está pronto para validação.",
    };
  }

  try {
    await repository.validatePriorityProfile(supabase, parsed.data.priorityProfileId, parsed.data.validationNote);
    revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a validação.");
  }
}

// ---------------------------------------------------------------------------
// Comparar
// ---------------------------------------------------------------------------

export async function computeCompatibilityAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = computeCompatibilityInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.runCompatibility(supabase, parsed.data.priorityProfileId);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível calcular a compatibilidade.");
  }
}

// ---------------------------------------------------------------------------
// Seleção e entrega — autoria sempre humana
// ---------------------------------------------------------------------------

export async function saveSelectionAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveSelectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const check = validateSelection(parsed.data.options.map((option) => option.professionalProfileId));
  if (!check.valid) return { success: false, error: check.error ?? "Seleção inválida." };

  const supabase = await createServerSupabaseClient();

  const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
  if (!profile) return { success: false, error: "Perfil de Prioridades não encontrado." };

  try {
    await repository.saveSelection(
      supabase,
      profile.caseId,
      parsed.data.priorityProfileId,
      authState.user.id,
      parsed.data.compositionRationale,
      parsed.data.options,
    );
    revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar a seleção.");
  }
}

export async function deliverSelectionAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = deliverSelectionInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.deliverSelection(supabase, parsed.data.curatedSelectionId);
    revalidatePath("/paciente");
    revalidatePath("/paciente/curadoria");
    revalidatePath("/curador/casos");
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível entregar a Curadoria.");
  }
}

// ---------------------------------------------------------------------------
// Decisão — só o paciente
// ---------------------------------------------------------------------------

export async function registerDecisionAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerDecisionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  const { data: selection } = await supabase
    .from("curated_selections")
    .select("id, case_id, status")
    .eq("id", parsed.data.curatedSelectionId)
    .maybeSingle();

  if (!selection || selection.status !== "DELIVERED") {
    return { success: false, error: "Esta Curadoria ainda não foi apresentada." };
  }

  try {
    await repository.registerPatientDecision(
      supabase,
      selection.case_id as string,
      parsed.data.curatedSelectionId,
      parsed.data.outcome,
      parsed.data.chosenOptionId ?? null,
      parsed.data.note ?? null,
    );
    revalidatePath("/paciente");
    revalidatePath("/paciente/curadoria");
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar sua decisão.");
  }
}

// ---------------------------------------------------------------------------
// Fase 1 — Acolhimento (correção reportada pelo Fundador em 2026-07-24: a
// tela explicava a fase mas não oferecia como RESOLVER os itens em aberto).
// ---------------------------------------------------------------------------

export async function registerAcolhimentoAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerAcolhimentoInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { caseId, contextReviewed, documentsReviewed } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Upsert por case_id: a Consulta Inicial é uma por Caso. Registrar a
  // revisão NÃO desmarca o que já foi revisado antes — o Acolhimento é
  // acumulativo, nunca regressivo (o paciente nunca recomeça do zero).
  const { data: existing, error: readError } = await supabase
    .from("consultation_records")
    .select("id, context_reviewed, documents_reviewed")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) return { success: false, error: "Não foi possível ler o Acolhimento." };

  const next = {
    context_reviewed: Boolean(existing?.context_reviewed) || contextReviewed,
    documents_reviewed: Boolean(existing?.documents_reviewed) || documentsReviewed,
  };

  const { error } = existing
    ? await supabase.from("consultation_records").update(next).eq("id", existing.id)
    : await supabase
        .from("consultation_records")
        .insert({ case_id: caseId, curator_id: authState.user.id, ...next });

  if (error) return { success: false, error: "Não foi possível registrar o Acolhimento." };

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/acolhimento`);
  return { success: true };
}
