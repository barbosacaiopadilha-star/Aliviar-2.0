import { z } from "zod";

import { CONTACT_MODES } from "./types";

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

// Nenhum default: o schema recusa a ausência de escolha. A paciente declara
// ou não declara — a plataforma não escolhe por ela.
export const defineContactModeInputSchema = z.object({
  caseId: caseIdSchema,
  contactMode: z.enum(CONTACT_MODES),
});
export type DefineContactModeFormInput = z.infer<
  typeof defineContactModeInputSchema
>;

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
