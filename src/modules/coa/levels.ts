import type { PipelineStage } from "@/modules/crm/pipeline";

import type { CoaJourneyPhase, CoaLevel } from "./types";

/** Etapas do funil CRM sob responsabilidade do Nível 1 — Atendimento. */
export const ATENDIMENTO_PIPELINE_STAGES: PipelineStage[] = [
  "new_contact",
  "first_response_pending",
  "in_service",
  "qualification",
  "proposal_or_contracting",
  "awaiting_payment",
  "contracted",
  "initial_consultation_scheduling",
  "initial_consultation_scheduled",
];

/** Etapas sob responsabilidade do Nível 2 — Curadoria. */
export const CURADORIA_PIPELINE_STAGES: PipelineStage[] = [
  "sent_to_curator",
  "curation_in_progress",
  "report_ready",
  "report_delivered",
];

/** Etapas sob responsabilidade do Nível 3 — Concierge (pós-escolha). */
export const CONCIERGE_PIPELINE_STAGES: PipelineStage[] = [
  "doctor_selected",
  "scheduling_support",
  "completed",
];

export const COA_LEVEL_PIPELINE_STAGES: Record<CoaLevel, PipelineStage[]> = {
  ATENDIMENTO: ATENDIMENTO_PIPELINE_STAGES,
  CURADORIA: CURADORIA_PIPELINE_STAGES,
  CONCIERGE: CONCIERGE_PIPELINE_STAGES,
};

export function resolveCoaLevelForPipelineStage(stage: PipelineStage): CoaLevel {
  if (CONCIERGE_PIPELINE_STAGES.includes(stage)) {
    return "CONCIERGE";
  }
  if (CURADORIA_PIPELINE_STAGES.includes(stage)) {
    return "CURADORIA";
  }
  return "ATENDIMENTO";
}

export function resolveJourneyPhase(stage: PipelineStage): CoaJourneyPhase {
  if (stage === "completed") return "encerramento";
  if (CONCIERGE_PIPELINE_STAGES.includes(stage)) return "acompanhamento";
  if (stage === "doctor_selected") return "escolha";
  if (CURADORIA_PIPELINE_STAGES.includes(stage)) return "curadoria";
  if (stage === "initial_consultation_scheduled" || stage === "initial_consultation_scheduling") {
    return "consulta_inicial";
  }
  if (stage === "contracted") return "assistido";
  return "lead";
}
