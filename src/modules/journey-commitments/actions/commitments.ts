"use server";

import { revalidatePath } from "next/cache";
import { assertActiveStaffInAction } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { journeyAcceptsCommitments } from "@/modules/journey-commitments/queries/commitments";
import {
  buildStatusUpdatePayload,
  createCommitmentSchema,
  emptyToNull,
  updateCommitmentStatusSchema,
  validateStatusTransition,
} from "@/modules/journey-commitments/schemas/commitment";
import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";

export type CommitmentActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function extractFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  });
  return fieldErrors;
}

export async function createCommitmentAction(
  journeyId: string,
  _prev: CommitmentActionResult | null,
  formData: FormData,
): Promise<CommitmentActionResult | null> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return { success: false, error: "Perfil interno ativo obrigatório." };
  }

  const accepts = await journeyAcceptsCommitments(journeyId);
  if (!accepts) {
    return {
      success: false,
      error: "Não é possível adicionar compromissos em Jornadas encerradas ou canceladas.",
    };
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    assigned_to: String(formData.get("assigned_to") ?? ""),
    due_date: String(formData.get("due_date") ?? ""),
  };

  const parsed = createCommitmentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Verifique os campos destacados.",
      fieldErrors: extractFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada." };
  }

  const { error } = await supabase.from("journey_commitments").insert({
    journey_id: journeyId,
    title: parsed.data.title,
    assigned_to: parsed.data.assigned_to,
    due_date: emptyToNull(parsed.data.due_date),
    created_by: user.id,
    status: "PENDING",
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("row-level security")
        ? "Responsável inválido ou operação não permitida."
        : error.message,
    };
  }

  revalidatePath(`/journeys/${journeyId}`);
  revalidatePath("/workspace");

  return { success: true };
}

export async function updateCommitmentStatusAction(
  journeyId: string,
  commitmentId: string,
  newStatus: CommitmentStatus,
): Promise<CommitmentActionResult> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return { success: false, error: "Perfil interno ativo obrigatório." };
  }

  const parsed = updateCommitmentStatusSchema.safeParse({
    commitment_id: commitmentId,
    status: newStatus,
  });

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("journey_commitments")
    .select("*")
    .eq("id", commitmentId)
    .eq("journey_id", journeyId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: "Compromisso não encontrado." };
  }

  if (!validateStatusTransition(existing.status as CommitmentStatus, newStatus)) {
    return { success: false, error: "Transição de status não permitida." };
  }

  const payload = buildStatusUpdatePayload(newStatus);

  const { error } = await supabase
    .from("journey_commitments")
    .update(payload)
    .eq("id", commitmentId)
    .eq("journey_id", journeyId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/journeys/${journeyId}`);
  revalidatePath("/workspace");

  return { success: true };
}
