import type { PipelineStage } from "@/modules/crm/pipeline";

/** Os três níveis operacionais do Centro de Operações Aliviar. */
export const COA_LEVELS = ["ATENDIMENTO", "CURADORIA", "CONCIERGE"] as const;
export type CoaLevel = (typeof COA_LEVELS)[number];

export const COA_LEVEL_LABELS: Record<CoaLevel, string> = {
  ATENDIMENTO: "Atendimento",
  CURADORIA: "Curadoria",
  CONCIERGE: "Concierge",
};

/** Papel operacional visível ao Assistido — nunca o nome do departamento. */
export const COA_RESPONSIBLE_ROLES = ["atendente", "curador", "concierge"] as const;
export type CoaResponsibleRole = (typeof COA_RESPONSIBLE_ROLES)[number];

export const COA_RESPONSIBLE_LABELS: Record<CoaResponsibleRole, string> = {
  atendente: "Supervisor",
  curador: "Curador",
  concierge: "Concierge",
};

export type CoaTransferRecord = {
  origin: CoaLevel;
  destination: CoaLevel;
  responsibleId: string;
  responsibleName: string;
  responsibleRole: CoaResponsibleRole;
  transferredAt: string;
  reason: string;
  notes?: string;
};

export type CoaJourneyPhase =
  | "lead"
  | "assistido"
  | "consulta_inicial"
  | "curadoria"
  | "escolha"
  | "acompanhamento"
  | "encerramento";

export type CoaLevelContext = {
  level: CoaLevel;
  pipelineStages: PipelineStage[];
};
