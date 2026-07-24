"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases/repository";
import { saveP002FieldCorrection } from "@/modules/ace/p002-field-corrections-repository";
import type { EstadoInformacao } from "@/modules/ace/core/information-state";
import type { P002CompletenessFieldId } from "@/modules/ace/protocols/p002-completeness";

const ESTADOS: EstadoInformacao[] = [
  "conhecido",
  "ausencia_declarada",
  "desconhecido",
  "nao_perguntado",
  "sem_resposta",
  "nao_se_aplica",
  "conflitante",
  "requer_confirmacao",
  "determinado_pelo_caso",
  "determinado_pelo_curador",
];

const FIELDS: P002CompletenessFieldId[] = [
  "decision",
  "goal",
  "especialidade",
  "exames",
  "preco_consulta",
  "outras_doencas",
  "localizacao",
  "convenio",
  "modalidade",
  "atendimento_anterior",
];

const saveCorrectionSchema = z.object({
  caseId: z.string().uuid(),
  decisionCaseArtifactId: z.string().uuid().optional(),
  field: z.enum(FIELDS as [P002CompletenessFieldId, ...P002CompletenessFieldId[]]),
  estado: z.enum(ESTADOS as [EstadoInformacao, ...EstadoInformacao[]]),
  motivo: z.string().trim().min(1).max(2000),
  valorAnterior: z.enum(ESTADOS as [EstadoInformacao, ...EstadoInformacao[]]).optional(),
});

export type P002CorrectionActionResult = { success: true } | { success: false; error: string };

export async function saveP002FieldCorrectionAction(
  input: unknown,
): Promise<P002CorrectionActionResult> {
  const parsed = saveCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let authState;
  try {
    authState = await requireAnyRoleForAction(["administrador", "curador_medico"]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();
  const kase = await getCase(supabase, parsed.data.caseId);
  if (!kase) return { success: false, error: "Caso não encontrado." };

  const isAdmin = authState.roles.includes("administrador");
  if (!isAdmin && kase.assignedCuratorId !== authState.user.id) {
    return { success: false, error: "Você só pode corrigir casos atribuídos a você." };
  }

  try {
    await saveP002FieldCorrection(supabase, {
      caseId: parsed.data.caseId,
      decisionCaseArtifactId: parsed.data.decisionCaseArtifactId ?? null,
      field: parsed.data.field,
      estado: parsed.data.estado,
      motivo: parsed.data.motivo,
      valorAnterior: parsed.data.valorAnterior,
      corrigidoPor: authState.user.id,
    });
    revalidatePath(`/curador/casos/${parsed.data.caseId}`);
    revalidatePath(`/admin/casos/${parsed.data.caseId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Não foi possível registrar a correção." };
  }
}
