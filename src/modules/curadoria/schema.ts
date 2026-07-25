import { z } from "zod";

import {
  COMPATIBILITY_BANDS,
  DECISION_OUTCOMES,
  MANDATORY_FILTER_KINDS,
  PRIORITY_CRITERIA,
} from "./types";

export const startConsultationInputSchema = z.object({
  caseId: z.string().uuid(),
});

export const savePatientHistoryInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  patientHistory: z
    .string()
    .trim()
    .min(1, "Registre o que você compreendeu da história antes de avançar.")
    .max(20000, "Texto muito longo."),
});

// Todo peso carrega sua evidência. A mensagem de erro fala do momento da
// conversa, nunca de "campo obrigatório" — é assim que o Curador pensa.
export const saveWeightInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  criterion: z.enum(PRIORITY_CRITERIA),
  weight: z.number().int().min(0).max(100),
  targetValue: z.string().trim().min(1).max(120).nullable().optional(),
  evidence: z
    .string()
    .trim()
    .min(1, "Registre o momento da conversa que originou este peso.")
    .max(2000, "Evidência muito longa."),
});

export const removeWeightInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  criterion: z.enum(PRIORITY_CRITERIA),
});

export const addMandatoryFilterInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  kind: z.enum(MANDATORY_FILTER_KINDS),
  value: z.string().trim().min(1, "Informe o valor do filtro.").max(120),
  note: z.string().trim().max(1000).optional(),
});

export const addPreferenceInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  value: z.string().trim().min(1, "Escreva a preferência como o paciente a disse.").max(500),
  note: z.string().trim().max(1000).optional(),
});

export const removeFilterInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  filterId: z.string().uuid(),
});

// A validação é um ato do paciente, registrado pelo Curador que a presenciou.
export const validateProfileInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  validationNote: z
    .string()
    .trim()
    .min(1, "Registre como o paciente confirmou que este Perfil é o dele.")
    .max(2000),
});

export const saveAllWeightsInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  weights: z.array(
    z.object({
      criterion: z.enum(PRIORITY_CRITERIA),
      weight: z.number().int().min(0).max(100),
      targetValue: z.string().trim().min(1).max(120).nullable().optional(),
      evidence: z
        .string()
        .trim()
        .min(1, "Registre o momento da conversa que originou este peso.")
        .max(2000),
    }),
  ),
});

export const computeCompatibilityInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
});

export const saveSelectionInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  compositionRationale: z
    .string()
    .trim()
    .min(1, "Explique por que estes três caminhos, juntos, fazem sentido para este paciente.")
    .max(4000),
  options: z
    .array(
      z.object({
        professionalProfileId: z.string().uuid(),
        band: z.enum(COMPATIBILITY_BANDS),
        rationale: z.string().trim().min(1, "Explique por que esta opção está aqui.").max(2000),
        tradeOff: z.string().trim().max(2000).optional(),
      }),
    )
    .length(3, "A Curadoria apresenta sempre exatamente três opções."),
});

export const deliverSelectionInputSchema = z.object({
  curatedSelectionId: z.string().uuid(),
});

export const registerDecisionInputSchema = z
  .object({
    curatedSelectionId: z.string().uuid(),
    outcome: z.enum(DECISION_OUTCOMES),
    chosenOptionId: z.string().uuid().nullable().optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((input) => (input.outcome === "CHOSEN" ? Boolean(input.chosenOptionId) : !input.chosenOptionId), {
    message: "Escolha uma das opções ou registre que nenhuma delas serviu.",
    path: ["chosenOptionId"],
  });

// Fase 1 — Acolhimento: as duas revisões que o Motor espera antes de liberar
// a História (COS_PHASE_DEFINITIONS.ACOLHIMENTO.exitCriteria).
export const registerAcolhimentoInputSchema = z.object({
  caseId: z.string().uuid(),
  contextReviewed: z.boolean(),
  documentsReviewed: z.boolean(),
});
