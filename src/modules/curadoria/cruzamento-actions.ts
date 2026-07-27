"use server";

/**
 * Actions da Mesa do Cruzamento — pesos 50/50, declaração de área e
 * declaração de critério.
 *
 * Arquivo próprio, e não um apêndice em `actions.ts`: aquelas actions servem
 * ao modelo legado de 100 pontos, e misturar os dois vocabulários no mesmo
 * arquivo é como a divergência silenciosa começa.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import { declareAreaCompatibility } from "./area-repository";
import { AREA_COMPATIBILITIES, ASSESSMENTS, PATIENT_CRITERIA, TECHNICAL_CRITERIA } from "./cruzamento";
import { declareCriterion, saveCruzamentoBlockWeights } from "./mesa-cruzamento";
import type { CuradoriaActionResult } from "./types";

const CURATOR_ROLES = ["administrador", "curador_medico"] as const;

function fail(error: unknown, fallback: string): CuradoriaActionResult {
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function revalidateMesa(caseId: string) {
  revalidatePath(`/coa/curadoria/casos/${caseId}`, "layout");
  revalidatePath(`/coa/curadoria`);
}

// ---------------------------------------------------------------------------
// Pesos — um bloco de cada vez, sempre fechado em 50
// ---------------------------------------------------------------------------

const ALL_CRITERIA = [...TECHNICAL_CRITERIA, ...PATIENT_CRITERIA] as const;

const saveBlockWeightsSchema = z.object({
  caseId: z.string().uuid(),
  block: z.enum(["TECNICO", "PRIORIDADES"]),
  weights: z.record(z.enum(ALL_CRITERIA), z.number().int().min(0).max(50)),
});

export async function saveCruzamentoWeightsAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction([...CURATOR_ROLES]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveBlockWeightsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await saveCruzamentoBlockWeights(
      supabase,
      parsed.data.caseId,
      parsed.data.block,
      parsed.data.weights,
      authState.user.id,
    );
    revalidateMesa(parsed.data.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar os pesos.");
  }
}

// ---------------------------------------------------------------------------
// Declaração de área
// ---------------------------------------------------------------------------

const declareAreaSchema = z
  .object({
    caseId: z.string().uuid(),
    professionalProfileId: z.string().uuid(),
    compatibility: z.enum(AREA_COMPATIBILITIES),
    confirmedByCurator: z.boolean().optional(),
    rationale: z.string().trim().optional(),
    areaTextReviewed: z.string().optional(),
    caseRequirementReviewed: z.string().optional(),
  })
  .superRefine((value, context) => {
    // As mesmas exigências do banco, ditas em português antes do insert.
    if (value.compatibility === "INCOMPATIVEL" && !value.rationale) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Eliminar exige justificativa — escreva por que a área não responde ao caso.",
      });
    }
    if (value.compatibility === "PARCIALMENTE_COMPATIVEL" && !value.rationale) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compatibilidade parcial exige justificativa.",
      });
    }
    if (value.compatibility === "INFORMACAO_INSUFICIENTE" && !value.rationale) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Registre o que falta verificar para este profissional participar.",
      });
    }
  });

export async function declareAreaAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction([...CURATOR_ROLES]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = declareAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await declareAreaCompatibility(supabase, {
      caseId: parsed.data.caseId,
      professionalProfileId: parsed.data.professionalProfileId,
      compatibility: parsed.data.compatibility,
      confirmedByCurator: parsed.data.confirmedByCurator ?? false,
      rationale: parsed.data.rationale ?? null,
      areaTextReviewed: parsed.data.areaTextReviewed ?? null,
      caseRequirementReviewed: parsed.data.caseRequirementReviewed ?? null,
      declaredBy: authState.user.id,
    });
    revalidateMesa(parsed.data.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a declaração de área.");
  }
}

// ---------------------------------------------------------------------------
// Declaração de critério
// ---------------------------------------------------------------------------

const declareCriterionSchema = z.object({
  caseId: z.string().uuid(),
  professionalProfileId: z.string().uuid(),
  criterion: z.enum(ALL_CRITERIA),
  assessment: z.enum(ASSESSMENTS),
  evidence: z.string().trim().min(1, "Toda avaliação registra a frase que a explica."),
});

export async function declareCriterionAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireAnyRoleForAction([...CURATOR_ROLES]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = declareCriterionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await declareCriterion(supabase, parsed.data.caseId, {
      professionalProfileId: parsed.data.professionalProfileId,
      criterion: parsed.data.criterion,
      assessment: parsed.data.assessment,
      evidence: parsed.data.evidence,
      declaredBy: authState.user.id,
    });
    revalidateMesa(parsed.data.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a avaliação.");
  }
}
