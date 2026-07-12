import { z } from "zod";

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

// Cada nota é um registro novo, append-only — nunca uma edição de nota
// anterior (ajuste pós-Sprint 2).
export const addCaseNoteInputSchema = z.object({
  caseId: z.string().uuid(),
  body: z.string().trim().min(1, "Escreva algo antes de salvar.").max(2000, "Texto muito longo."),
});

export type AddCaseNoteInput = z.infer<typeof addCaseNoteInputSchema>;
