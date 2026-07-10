import { z } from "zod";
import type { JourneyEventCategory } from "@/modules/journey-events/types/journey-event";

export const journeyEventCategorySchema = z.enum([
  "JOURNEY",
  "CONTACT",
  "CONSULTATION",
  "EXAM",
  "DOCUMENT",
  "DECISION",
  "OPERATIONAL",
  "OBSERVATION",
]);

const MAX_FUTURE_MS = 7 * 24 * 60 * 60 * 1000;

function isValidOccurredAt(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now() + MAX_FUTURE_MS;
}

const baseEventFields = {
  category: journeyEventCategorySchema,
  title: z
    .string({ required_error: "Título é obrigatório" })
    .trim()
    .min(1, "Título é obrigatório"),
  description: z.string().trim().optional().or(z.literal("")),
  journey_impact: z.string().trim().optional().or(z.literal("")),
  next_step: z.string().trim().optional().or(z.literal("")),
  occurred_at: z
    .string({ required_error: "Data do acontecimento é obrigatória" })
    .min(1, "Data do acontecimento é obrigatória")
    .refine(isValidOccurredAt, {
      message: "Data do acontecimento inválida ou muito distante no futuro",
    }),
  is_highlighted: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on"),
};

export const createJourneyEventSchema = z.object(baseEventFields);

export const correctJourneyEventSchema = z.object({
  original_event_id: z.string().uuid("Evento original inválido"),
  correction_reason: z
    .string({ required_error: "Motivo da correção é obrigatório" })
    .trim()
    .min(1, "Motivo da correção é obrigatório"),
  ...baseEventFields,
});

export type CreateJourneyEventInput = z.infer<typeof createJourneyEventSchema>;
export type CorrectJourneyEventInput = z.infer<typeof correctJourneyEventSchema>;

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function parseCategory(value: string): JourneyEventCategory | null {
  const parsed = journeyEventCategorySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toIsoDateTime(localDatetime: string): string {
  return new Date(localDatetime).toISOString();
}
