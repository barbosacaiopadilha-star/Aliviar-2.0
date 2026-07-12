import { z } from "zod";

// Espelha as regras estruturais do P009 (docs/ace/04-specs/
// P009-human-review/specification.md) do lado do formulário — validação
// antecipada e amigável; a autoridade final continua sendo o próprio
// protocolo (createHumanReviewResult), nunca este schema.
const PROTOCOL_IDS = ["P001", "P002", "P003", "P004", "P005", "P006", "P007", "P008", "P009", "P010"] as const;

const providerChangeSchema = z.object({
  type: z.enum(["added", "removed"]),
  providerId: z.string().uuid(),
  rationale: z.string().trim().min(1, "Toda alteração precisa de uma justificativa própria."),
  evidenceReferences: z
    .array(z.string().trim().min(1))
    .min(1, "Toda alteração precisa de ao menos uma evidência própria."),
});

const reviewRationaleSchema = z
  .string()
  .trim()
  .min(10, "Descreva a justificativa da decisão (mínimo 10 caracteres) — obrigatória para toda ação.");

const evidenceReferencesSchema = z.array(z.string().trim().min(1));

const caseIdSchema = z.string().uuid();

const approveInputSchema = z.object({
  caseId: caseIdSchema,
  reviewAction: z.literal("APPROVE"),
  reviewRationale: reviewRationaleSchema,
  evidenceReferences: evidenceReferencesSchema.min(1, "Aprovar exige ao menos uma evidência citada."),
});

const adjustInputSchema = z.object({
  caseId: caseIdSchema,
  reviewAction: z.literal("ADJUST"),
  reviewRationale: reviewRationaleSchema,
  evidenceReferences: evidenceReferencesSchema.min(1, "Ajustar exige ao menos uma evidência citada."),
  changes: z.array(providerChangeSchema).min(1, "Ajustar exige ao menos uma alteração registrada — caso contrário, use Aprovar."),
});

const rejectInputSchema = z.object({
  caseId: caseIdSchema,
  reviewAction: z.literal("REJECT"),
  reviewRationale: reviewRationaleSchema,
  evidenceReferences: evidenceReferencesSchema.default([]),
  returnToProtocol: z.enum(PROTOCOL_IDS).nullable().optional(),
});

const requestMoreInformationInputSchema = z.object({
  caseId: caseIdSchema,
  reviewAction: z.literal("REQUEST_MORE_INFORMATION"),
  reviewRationale: reviewRationaleSchema,
  evidenceReferences: evidenceReferencesSchema.default([]),
  returnToProtocol: z.enum(PROTOCOL_IDS).nullable().optional(),
});

export const submitHumanReviewInputSchema = z.discriminatedUnion("reviewAction", [
  approveInputSchema,
  adjustInputSchema,
  rejectInputSchema,
  requestMoreInformationInputSchema,
]);

export type SubmitHumanReviewFormInput = z.infer<typeof submitHumanReviewInputSchema>;
