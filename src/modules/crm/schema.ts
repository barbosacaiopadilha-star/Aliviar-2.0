import { z } from "zod";

import { PIPELINE_STAGES } from "./pipeline";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CONSENT_STATUSES,
  CONTACT_SOURCES,
  INTERACTION_CHANNELS,
  INTERACTION_DIRECTIONS,
  INTERACTION_TYPES,
  INTERACTION_VISIBILITIES,
  PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "./types";

export const createContactInputSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe o nome."),
    preferredName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
    city: z.string().trim().optional(),
    state: z.string().trim().length(2, "UF deve ter 2 letras.").optional().or(z.literal("")),
    source: z.enum(CONTACT_SOURCES),
    sourceDetail: z.string().trim().optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    priority: z.enum(PRIORITIES).default("media"),
    initialReason: z.string().trim().optional(),
    preferredChannel: z.enum(INTERACTION_CHANNELS).optional(),
    consentStatus: z.enum(CONSENT_STATUSES).default("pendente"),
    nextActionAt: z.string().datetime().optional(),
    initialNote: z.string().trim().optional(),
    acknowledgeDuplicates: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.phone?.trim() || data.email?.trim()), {
    message: "Informe telefone ou e-mail.",
    path: ["phone"],
  });

export const updateContactInputSchema = z.object({
  contactId: z.string().uuid(),
  fullName: z.string().trim().min(2).optional(),
  preferredName: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  city: z.string().trim().nullable().optional(),
  state: z.string().trim().length(2).nullable().optional().or(z.literal("")),
  source: z.enum(CONTACT_SOURCES).optional(),
  sourceDetail: z.string().trim().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  initialReason: z.string().trim().nullable().optional(),
  preferredChannel: z.enum(INTERACTION_CHANNELS).nullable().optional(),
  consentStatus: z.enum(CONSENT_STATUSES).optional(),
  nextActionAt: z.string().datetime().nullable().optional(),
});

export const changePipelineStageInputSchema = z.object({
  contactId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  toStage: z.enum(PIPELINE_STAGES),
  reason: z.string().trim().optional(),
  explicitAdminOverride: z.boolean().optional(),
  explicitCompletionConfirmed: z.boolean().optional(),
});

export const createInteractionInputSchema = z.object({
  contactId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  type: z.enum(INTERACTION_TYPES),
  channel: z.enum(INTERACTION_CHANNELS),
  direction: z.enum(INTERACTION_DIRECTIONS),
  subject: z.string().trim().optional(),
  content: z.string().trim().min(1, "Descreva a interação."),
  occurredAt: z.string().datetime().optional(),
  externalReference: z.string().trim().optional(),
  visibility: z.enum(INTERACTION_VISIBILITIES).default("operacional"),
});

export const createTaskInputSchema = z.object({
  contactId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  type: z.enum(TASK_TYPES).default("retorno"),
  priority: z.enum(PRIORITIES).default("media"),
  assignedTo: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
});

export const updateTaskStatusInputSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
});

export const createAppointmentInputSchema = z.object({
  contactId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  type: z.enum(APPOINTMENT_TYPES),
  assignedTo: z.string().uuid().optional(),
  locationOrLink: z.string().trim().optional(),
});

export const updateAppointmentInputSchema = z.object({
  appointmentId: z.string().uuid(),
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().nullable().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().nullable().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  assignedTo: z.string().uuid().optional(),
  locationOrLink: z.string().trim().nullable().optional(),
});

export const archiveContactInputSchema = z.object({
  contactId: z.string().uuid(),
  reason: z.string().trim().optional(),
});

export const siteLeadInputSchema = z
  .object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    city: z.string().trim().optional(),
    state: z.string().trim().length(2).optional().or(z.literal("")),
    message: z.string().trim().optional(),
    consentGranted: z.boolean(),
    honeypot: z.string().optional(),
  })
  .refine((data) => Boolean(data.phone?.trim() || data.email?.trim()), {
    message: "Informe telefone ou e-mail.",
    path: ["phone"],
  });

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentInputSchema>;
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;
export type ChangePipelineStageInput = z.infer<typeof changePipelineStageInputSchema>;
export type CreateInteractionInput = z.infer<typeof createInteractionInputSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;
export type SiteLeadInput = z.infer<typeof siteLeadInputSchema>;
