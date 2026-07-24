// Etapas do funil operacional do CRM — fonte única de identificadores,
// rótulos, ordem, cores e transições permitidas.

export const PIPELINE_STAGES = [
  "new_contact",
  "first_response_pending",
  "in_service",
  "qualification",
  "proposal_or_contracting",
  "awaiting_payment",
  "contracted",
  "initial_consultation_scheduling",
  "initial_consultation_scheduled",
  "sent_to_curator",
  "curation_in_progress",
  "report_ready",
  "report_delivered",
  "doctor_selected",
  "scheduling_support",
  "completed",
  "lost",
  "archived",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new_contact: "Novo contato",
  first_response_pending: "Aguardando primeira resposta",
  in_service: "Em atendimento",
  qualification: "Qualificação",
  proposal_or_contracting: "Proposta / contratação",
  awaiting_payment: "Aguardando pagamento",
  contracted: "Contratado",
  initial_consultation_scheduling: "Agendando consulta inicial",
  initial_consultation_scheduled: "Consulta inicial agendada",
  sent_to_curator: "Encaminhado ao Curador",
  curation_in_progress: "Curadoria em andamento",
  report_ready: "Relatório pronto",
  report_delivered: "Relatório entregue",
  doctor_selected: "Médico escolhido",
  scheduling_support: "Apoio ao agendamento",
  completed: "Concluído",
  lost: "Perdido",
  archived: "Arquivado",
};

export const PIPELINE_STAGE_ORDER: Record<PipelineStage, number> = {
  new_contact: 1,
  first_response_pending: 2,
  in_service: 3,
  qualification: 4,
  proposal_or_contracting: 5,
  awaiting_payment: 6,
  contracted: 7,
  initial_consultation_scheduling: 8,
  initial_consultation_scheduled: 9,
  sent_to_curator: 10,
  curation_in_progress: 11,
  report_ready: 12,
  report_delivered: 13,
  doctor_selected: 14,
  scheduling_support: 15,
  completed: 16,
  lost: 17,
  archived: 18,
};

export const TERMINAL_PIPELINE_STAGES: PipelineStage[] = ["completed", "lost", "archived"];

export const CURATOR_VISIBLE_STAGES: PipelineStage[] = [
  "sent_to_curator",
  "curation_in_progress",
  "report_ready",
  "report_delivered",
  "doctor_selected",
  "scheduling_support",
  "completed",
];

export type StageTransitionContext = {
  hasInitialConsultationAppointment?: boolean;
  hasResponsibleCurator?: boolean;
  explicitAdminOverride?: boolean;
  explicitCompletionConfirmed?: boolean;
};

/** Monta contexto de transição — override administrativo nunca vem do cliente. */
export function resolveStageTransitionContext(
  roles: string[],
  input: {
    hasInitialConsultationAppointment?: boolean;
    hasResponsibleCurator?: boolean;
    explicitCompletionConfirmed?: boolean;
  } = {},
): StageTransitionContext {
  return {
    hasInitialConsultationAppointment: input.hasInitialConsultationAppointment,
    hasResponsibleCurator: input.hasResponsibleCurator,
    explicitAdminOverride: roles.includes("administrador"),
    explicitCompletionConfirmed: input.explicitCompletionConfirmed,
  };
}

const BASE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  new_contact: ["first_response_pending", "in_service", "lost", "archived"],
  first_response_pending: ["in_service", "lost", "archived"],
  in_service: ["qualification", "lost", "archived"],
  qualification: ["proposal_or_contracting", "lost", "archived"],
  proposal_or_contracting: ["awaiting_payment", "contracted", "lost", "archived"],
  awaiting_payment: ["contracted", "lost", "archived"],
  contracted: ["initial_consultation_scheduling", "lost", "archived"],
  initial_consultation_scheduling: ["initial_consultation_scheduled", "lost", "archived"],
  initial_consultation_scheduled: ["sent_to_curator", "lost", "archived"],
  sent_to_curator: ["curation_in_progress", "lost", "archived"],
  curation_in_progress: ["report_ready", "lost", "archived"],
  report_ready: ["report_delivered", "lost", "archived"],
  report_delivered: ["doctor_selected", "lost", "archived"],
  doctor_selected: ["scheduling_support", "completed", "lost", "archived"],
  scheduling_support: ["completed", "lost", "archived"],
  completed: [],
  lost: ["archived"],
  archived: [],
};

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function allowedNextStages(
  current: PipelineStage,
  context: StageTransitionContext = {},
): PipelineStage[] {
  const base = BASE_TRANSITIONS[current] ?? [];
  return base.filter((stage) => isTransitionAllowed(current, stage, context));
}

export function isTransitionAllowed(
  from: PipelineStage,
  to: PipelineStage,
  context: StageTransitionContext = {},
): boolean {
  if (from === to) return false;
  if (!(BASE_TRANSITIONS[from] ?? []).includes(to)) return false;

  if (to === "initial_consultation_scheduled" && !context.hasInitialConsultationAppointment) {
    return context.explicitAdminOverride === true;
  }

  if (to === "sent_to_curator" && !context.hasResponsibleCurator) {
    return context.explicitAdminOverride === true;
  }

  if (to === "completed" && !context.explicitCompletionConfirmed && !context.explicitAdminOverride) {
    return false;
  }

  return true;
}

export function comparePipelineStages(a: PipelineStage, b: PipelineStage): number {
  return PIPELINE_STAGE_ORDER[a] - PIPELINE_STAGE_ORDER[b];
}
