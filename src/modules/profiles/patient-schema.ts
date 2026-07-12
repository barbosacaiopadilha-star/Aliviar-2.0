import { z } from "zod";

// FormData sempre envia string, mesmo para campo "vazio" — normaliza para
// undefined antes da validação de cada campo opcional.
function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export const communicationChannelSchema = z.enum(["email", "sms", "whatsapp"]);

export const patientProfileSchema = z.object({
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\+?[0-9()\-\s]{8,20}$/, "Informe um telefone válido.")
      .optional(),
  ),
  city: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, "Cidade muito longa.").optional(),
  ),
  state: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a sigla do estado (2 letras), ex.: SP.")
      .optional(),
  ),
  preferredChannel: communicationChannelSchema,
  acceptsReminders: z.boolean(),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
