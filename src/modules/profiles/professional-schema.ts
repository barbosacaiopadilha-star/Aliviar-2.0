import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export const professionalProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Informe o nome de exibição.")
    .max(160, "Nome muito longo."),
  professionalIdentifier: z
    .string()
    .trim()
    .min(2, "Informe a identificação profissional.")
    .max(60, "Identificação muito longa."),
  crm: z.preprocess(emptyToUndefined, z.string().trim().max(20, "CRM muito longo.").optional()),
  crmUf: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a sigla do estado (2 letras), ex.: SP.")
      .optional(),
  ),
  professionalSummary: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000, "Resumo muito longo.").optional(),
  ),
  institutionName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160, "Nome da instituição muito longo.").optional(),
  ),
});

export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;

export const professionalStatusSchema = z.enum(["ativo", "inativo"]);
export const professionalPublicationStatusSchema = z.enum(["publicado", "nao_publicado"]);
