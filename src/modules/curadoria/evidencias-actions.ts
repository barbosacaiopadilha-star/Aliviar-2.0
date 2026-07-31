"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { revalidateCaseSurfaces } from "@/modules/cases/revalidate";

import { SOURCE_TIERS } from "./fontes";
import {
  markEvidenceOutdated,
  registerEvidenceDivergence,
  requestPracticeUpdate,
  resolveEvidenceDivergence,
  resolveUpdateRequest,
  verifyPracticeEvidence,
} from "./evidencias-pratica-repository";

/**
 * GOVERNANÇA DA BASE DE EVIDÊNCIAS — as actions da operação.
 *
 * Ownership vindo do código, não de presunção (Etapa 3):
 *   * VERIFICAR, RESOLVER divergência, DESATUALIZAR, FECHAR solicitação —
 *     administrador. É a RLS vigente da Base (escrita = administrador) e das
 *     divergências (admin_all), a mesma linha da ADR-040 item 6.
 *   * ABRIR divergência e SOLICITAR atualização — curador_medico também: as
 *     policies `divergences_curator_open` e `update_requests_insert_operacao`
 *     existem exatamente para isso.
 *   * O profissional não alcança nenhuma destas portas — corrigir é
 *     responder de novo pelo Protocolo, nunca assinar a própria verificação.
 *
 * Nenhuma action aqui conclui compatibilidade ou toca Case.
 */

const verifySchema = z.object({
  professionalProfileId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  expectedVersion: z.number().int().positive(),
  verificationSource: z.string().min(3).max(500),
  verificationTier: z.enum(SOURCE_TIERS),
  caseId: z.string().uuid().nullable(),
});

export async function verifyEvidenceAction(input: unknown) {
  const state = await requireAnyRoleForAction(["administrador"]);
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados de verificação inválidos." };

  const supabase = await createServerSupabaseClient();
  try {
    await verifyPracticeEvidence(supabase, {
      professionalProfileId: parsed.data.professionalProfileId,
      subcriterionCode: parsed.data.subcriterionCode,
      expectedVersion: parsed.data.expectedVersion,
      verificationSource: parsed.data.verificationSource,
      verificationTier: parsed.data.verificationTier,
      verifiedBy: state.user.id,
    });
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  if (parsed.data.caseId) revalidateCaseSurfaces(parsed.data.caseId);
  revalidatePath("/profissional");
  return { success: true as const };
}

const outdatedSchema = z.object({
  professionalProfileId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  reason: z.string().min(3).max(280),
  caseId: z.string().uuid().nullable(),
});

export async function markEvidenceOutdatedAction(input: unknown) {
  await requireAnyRoleForAction(["administrador"]);
  const parsed = outdatedSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Motivo inválido." };

  const supabase = await createServerSupabaseClient();
  try {
    await markEvidenceOutdated(supabase, parsed.data);
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  if (parsed.data.caseId) revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

const openDivergenceSchema = z.object({
  professionalProfileId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  declaredVersion: z.string().min(3).max(500),
  foundVersion: z.string().min(3).max(500),
  severity: z.enum(["critica", "observacao"]),
  caseId: z.string().uuid().nullable(),
});

export async function openEvidenceDivergenceAction(input: unknown) {
  const state = await requireAnyRoleForAction(["curador_medico", "administrador"]);
  const parsed = openDivergenceSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados da divergência inválidos." };

  // A divergência entra pelo cliente de quem abre (RLS: curador e admin); o
  // flip do estado da evidência atravessa a porta controlada — a Base tem
  // escrita da operação, e quem chegou aqui é operação autenticada.
  const supabase = await createServerSupabaseClient();
  const service = createAdminSupabaseClient();
  try {
    await registerEvidenceDivergence(supabase, service, {
      ...parsed.data,
      openedBy: state.user.id,
    });
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  if (parsed.data.caseId) revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

const resolveDivergenceSchema = z.object({
  divergenceId: z.string().uuid(),
  resolution: z.string().min(3).max(500),
  resolvedVersion: z.string().min(1).max(500),
  markOutdated: z.boolean(),
  professionalProfileId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  caseId: z.string().uuid().nullable(),
});

export async function resolveEvidenceDivergenceAction(input: unknown) {
  const state = await requireAnyRoleForAction(["administrador"]);
  const parsed = resolveDivergenceSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados da resolução inválidos." };

  const supabase = await createServerSupabaseClient();
  try {
    await resolveEvidenceDivergence(supabase, {
      divergenceId: parsed.data.divergenceId,
      resolution: parsed.data.resolution,
      resolvedVersion: parsed.data.resolvedVersion,
      resolvedBy: state.user.id,
    });
    if (parsed.data.markOutdated) {
      await markEvidenceOutdated(supabase, {
        professionalProfileId: parsed.data.professionalProfileId,
        subcriterionCode: parsed.data.subcriterionCode,
        reason: `Divergência resolvida contra a declaração: ${parsed.data.resolution}`.slice(0, 280),
      });
    }
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  if (parsed.data.caseId) revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

const requestUpdateSchema = z.object({
  professionalProfileId: z.string().uuid(),
  subcriterionCodes: z.array(z.string().max(80)).min(1).max(28),
  reason: z.string().min(3).max(500),
  dueHint: z.string().date().nullable(),
  caseId: z.string().uuid().nullable(),
});

export async function requestPracticeUpdateAction(input: unknown) {
  const state = await requireAnyRoleForAction(["curador_medico", "administrador"]);
  const parsed = requestUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados da solicitação inválidos." };

  const supabase = await createServerSupabaseClient();
  try {
    await requestPracticeUpdate(supabase, {
      professionalProfileId: parsed.data.professionalProfileId,
      subcriterionCodes: parsed.data.subcriterionCodes,
      reason: parsed.data.reason,
      requestedBy: state.user.id,
      dueHint: parsed.data.dueHint,
    });
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  if (parsed.data.caseId) revalidateCaseSurfaces(parsed.data.caseId);
  revalidatePath("/profissional");
  return { success: true as const };
}

const resolveRequestSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["atendida", "cancelada"]),
});

export async function resolveUpdateRequestAction(input: unknown) {
  const state = await requireAnyRoleForAction(["administrador"]);
  const parsed = resolveRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  try {
    await resolveUpdateRequest(supabase, { ...parsed.data, resolvedBy: state.user.id });
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  revalidatePath("/profissional");
  return { success: true as const };
}
