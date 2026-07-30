import { z } from "zod";

import { RESPONSIBLE_ROLES } from "./responsibility";
import { CASE_STATUSES } from "./types";

export const createCaseInputSchema = z.object({
  storyId: z.string().uuid(),
  assignedCuratorId: z.string().uuid().optional(),
});

export type CreateCaseInput = z.infer<typeof createCaseInputSchema>;

export const reassignCuratorInputSchema = z.object({
  caseId: z.string().uuid(),
  newCuratorId: z.string().uuid().nullable(),
  reason: z.string().max(500, "Justificativa muito longa.").optional(),
});

export type ReassignCuratorInput = z.infer<typeof reassignCuratorInputSchema>;

export const changeCaseStatusInputSchema = z.object({
  caseId: z.string().uuid(),
  nextStatus: z.enum(CASE_STATUSES),
});

export type ChangeCaseStatusInput = z.infer<typeof changeCaseStatusInputSchema>;

// Transferência de responsabilidade do Case entre os três níveis humanos.
// O motivo é obrigatório aqui pelo mesmo motivo que é obrigatório no banco:
// uma passagem de bastão sem motivo não é rastreável depois.
export const transferCaseResponsibilityInputSchema = z.object({
  caseId: z.string().uuid(),
  newResponsibleId: z.string().uuid(),
  newRole: z.enum(RESPONSIBLE_ROLES),
  reason: z
    .string()
    .trim()
    .min(1, "Explique por que o Case está mudando de responsável.")
    .max(500, "Justificativa muito longa."),
});

export type TransferCaseResponsibilityInput = z.infer<typeof transferCaseResponsibilityInputSchema>;

// Cada nota é um registro novo, append-only — nunca uma edição de nota
// anterior (ajuste pós-Sprint 2).
export const addCaseNoteInputSchema = z.object({
  caseId: z.string().uuid(),
  body: z.string().trim().min(1, "Escreva algo antes de salvar.").max(2000, "Texto muito longo."),
});

export type AddCaseNoteInput = z.infer<typeof addCaseNoteInputSchema>;
