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

// Fase 2 — História: narrativa organizada + reconhecimento do paciente.
export const registerHistoriaInputSchema = z
  .object({
    caseId: z.string().uuid(),
    narrative: z.string().trim().max(8000).optional(),
    confirmUnderstanding: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.narrative?.trim()) || v.confirmUnderstanding, {
    message: "Registre a história ou confirme o reconhecimento.",
  });

// Fase 3 — Caso: contexto clínico como fato relatado (a Aliviar nunca
// diagnostica nem interpreta exame — comentário da própria tabela).
export const registerCasoInputSchema = z.object({
  caseId: z.string().uuid(),
  clinicalContext: z.string().trim().min(1, "Descreva o contexto clínico relatado.").max(8000),
});

// ---------------------------------------------------------------------------
// Fase 8 — Relatório: o documento que o paciente relê sozinho.
//
// Os critérios de saída da fase (COS_PHASE_DEFINITIONS.RELATORIO) exigem, das
// três opções, justificativa + relação com os pesos + ao menos um ponto de
// atenção, mais a justificativa da composição. O schema exige exatamente isso:
// uma opção sem o que ela custa é recomendação disfarçada (Experience §2.5).
// ---------------------------------------------------------------------------
export const saveReportInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  compositionRationale: z
    .string()
    .trim()
    .min(1, "Explique por que estas três, juntas, servem a este paciente.")
    .max(4000),
  options: z
    .array(
      z.object({
        professionalProfileId: z.string().uuid(),
        justification: z.string().trim().min(1, "Explique por que esta opção está aqui.").max(4000),
        relationToWeights: z
          .string()
          .trim()
          .min(1, "Relacione esta opção com os pesos que o paciente validou.")
          .max(4000),
        attentionPoints: z
          .array(z.string().trim().min(1))
          .min(1, "Toda opção precisa dizer o que custa."),
        favorablePoints: z.array(z.string().trim().min(1)).default([]),
        suggestedQuestions: z.array(z.string().trim().min(1)).default([]),
        curatorObservations: z.string().trim().max(4000).nullable().optional(),
      }),
    )
    .length(3, "A Curadoria apresenta sempre exatamente três opções."),
});

export const emitReportInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
});

// Fase 9 — Devolutiva: o registro do encontro em que as opções foram
// apresentadas. Não é a decisão do paciente — essa é ato dele, e a RLS de
// patient_curadoria_decisions só aceita a própria pessoa.
export const registerDevolutivaInputSchema = z.object({
  priorityProfileId: z.string().uuid(),
  patientQuestions: z.array(z.string().trim().min(1)).default([]),
  observations: z.array(z.string().trim().min(1)).default([]),
  nextSteps: z.array(z.string().trim().min(1)).default([]),
});
