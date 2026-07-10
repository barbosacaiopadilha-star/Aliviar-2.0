import { z } from "zod";
import type { JourneyPriority } from "@/lib/types/database";

export const journeyPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhone(value: string): string {
  const digits = normalizeDigits(value);
  return digits;
}

export const patientFieldsSchema = z.object({
  full_name: z
    .string({ required_error: "Nome completo é obrigatório" })
    .trim()
    .min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  preferred_name: z.string().trim().optional().or(z.literal("")),
  birth_date: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      { message: "Data de nascimento não pode estar no futuro" },
    ),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? normalizeDigits(value) : ""))
    .refine((value) => !value || value.length === 11, {
      message: "CPF deve conter 11 dígitos quando informado",
    }),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? normalizePhone(value) : "")),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "E-mail inválido",
    }),
  city: z.string().trim().optional().or(z.literal("")),
  state: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ?? "").toUpperCase())
    .refine((value) => !value || /^[A-Z]{2}$/.test(value), {
      message: "Estado deve ter 2 letras quando informado",
    }),
  health_plan: z.string().trim().optional().or(z.literal("")),
});

export const journeyFieldsSchema = z.object({
  title: z
    .string({ required_error: "Título da Jornada é obrigatório" })
    .trim()
    .min(1, "Título da Jornada é obrigatório"),
  objective: z.string().trim().optional().or(z.literal("")),
  manager_id: z
    .string({ required_error: "Gestor é obrigatório" })
    .uuid("Gestor inválido"),
  priority: journeyPrioritySchema.default("NORMAL"),
  opened_at: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => {
        if (!value) return true;
        return !Number.isNaN(new Date(value).getTime());
      },
      { message: "Data de abertura inválida" },
    ),
});

export const createPatientWithJourneySchema = patientFieldsSchema.merge(journeyFieldsSchema);

export type CreatePatientWithJourneyInput = z.infer<typeof createPatientWithJourneySchema>;
export type PatientFieldsInput = z.infer<typeof patientFieldsSchema>;
export type JourneyFieldsInput = z.infer<typeof journeyFieldsSchema>;

export function emptyToNull(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export function parsePriority(value: string): JourneyPriority {
  const parsed = journeyPrioritySchema.safeParse(value);
  return parsed.success ? parsed.data : "NORMAL";
}
