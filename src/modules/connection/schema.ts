import { z } from "zod";

// Validação antecipada e amigável do lado da Server Action — a autoridade
// final continua sendo o domínio puro (commands.ts) e o banco (PR1/PR3),
// nunca este schema.

const caseIdSchema = z.string().uuid();
const professionalProfileIdSchema = z.string().uuid();

export const createConnectionInputSchema = z.object({
  caseId: caseIdSchema,
  professionalProfileId: professionalProfileIdSchema,
});
export type CreateConnectionFormInput = z.infer<
  typeof createConnectionInputSchema
>;

export const correctChoiceInputSchema = z.object({
  caseId: caseIdSchema,
  newProfessionalProfileId: professionalProfileIdSchema,
});
export type CorrectChoiceFormInput = z.infer<typeof correctChoiceInputSchema>;

export const registerContactIntentInputSchema = z.object({
  caseId: caseIdSchema,
});
export type RegisterContactIntentFormInput = z.infer<
  typeof registerContactIntentInputSchema
>;

export const confirmFirstAppointmentInputSchema = z.object({
  caseId: caseIdSchema,
});
export type ConfirmFirstAppointmentFormInput = z.infer<
  typeof confirmFirstAppointmentInputSchema
>;

export const closeWithoutRelationshipInputSchema = z.object({
  caseId: caseIdSchema,
  reason: z.string().trim().min(1).optional(),
});
export type CloseWithoutRelationshipFormInput = z.infer<
  typeof closeWithoutRelationshipInputSchema
>;
