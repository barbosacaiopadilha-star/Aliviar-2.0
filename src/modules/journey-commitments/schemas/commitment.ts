import { z } from "zod";
import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";
import { ALLOWED_STATUS_TRANSITIONS } from "@/modules/journey-commitments/types/commitment";

export const commitmentStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

function isNotPastDate(value: string): boolean {
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export const createCommitmentSchema = z.object({
  title: z
    .string({ required_error: "Descrição do compromisso é obrigatória" })
    .trim()
    .min(5, "Descrição deve ter pelo menos 5 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  assigned_to: z
    .string({ required_error: "Responsável é obrigatório" })
    .uuid("Responsável inválido"),
  due_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || isNotPastDate(value), {
      message: "Prazo não pode estar no passado",
    }),
});

export const updateCommitmentStatusSchema = z.object({
  commitment_id: z.string().uuid("Compromisso inválido"),
  status: commitmentStatusSchema,
});

export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;
export type UpdateCommitmentStatusInput = z.infer<typeof updateCommitmentStatusSchema>;

export function validateStatusTransition(
  current: CommitmentStatus,
  next: CommitmentStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[current].includes(next);
}

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function buildStatusUpdatePayload(
  newStatus: CommitmentStatus,
): Record<string, unknown> {
  const now = new Date().toISOString();

  switch (newStatus) {
    case "IN_PROGRESS":
      return { status: newStatus, completed_at: null, cancelled_at: null };
    case "COMPLETED":
      return { status: newStatus, completed_at: now, cancelled_at: null };
    case "CANCELLED":
      return { status: newStatus, cancelled_at: now, completed_at: null };
    default:
      return { status: newStatus };
  }
}
