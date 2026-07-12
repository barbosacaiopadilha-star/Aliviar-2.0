import { z } from "zod";

import { STORY_STEPS } from "./types";

export const suaHistoriaPatchSchema = z
  .object({
    paraQuem: z.enum(["para-mim", "para-outra-pessoa"]),
    motivo: z.string().max(2000, "Texto muito longo."),
    historia: z.string().max(5000, "Texto muito longo."),
    informacoesImportantes: z.string().max(2000, "Texto muito longo."),
    preferenciaModalidade: z.enum(["online", "presencial", "tanto-faz"]),
  })
  .partial();

export const saveStoryDraftInputSchema = z.object({
  storyId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
  patch: suaHistoriaPatchSchema,
  currentStep: z.enum(STORY_STEPS),
});

export type SaveStoryDraftInput = z.infer<typeof saveStoryDraftInputSchema>;

export const submitStoryInputSchema = z.object({
  storyId: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
});

export type SubmitStoryInput = z.infer<typeof submitStoryInputSchema>;
