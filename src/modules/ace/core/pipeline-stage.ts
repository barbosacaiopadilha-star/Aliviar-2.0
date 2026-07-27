// Ordem completa do pipeline do ACE (docs/ace/01-framework/framework.md,
// seção 2.1) — usada apenas para ordenar estágios na política de campos
// (core/field-policy.ts). Distinto de `ProtocolId` (protocol-id.ts), que
// enumera somente os protocolos já especificados. P008-P010 aparecem aqui
// apenas como marcadores de ordem — nenhuma especificação é antecipada por
// isso (governance.md, seção 3).

export type PipelineStageId =
  | "P001"
  | "P002"
  | "P003"
  | "P004"
  | "P005"
  | "P006"
  | "P007"
  | "P008"
  | "P009"
  | "P010";

export const PIPELINE_STAGE_ORDER: Readonly<Record<PipelineStageId, number>> = {
  P001: 1,
  P002: 2,
  P003: 3,
  P004: 4,
  P005: 5,
  P006: 6,
  P007: 7,
  P008: 8,
  P009: 9,
  P010: 10,
};

export function stageOrder(stage: PipelineStageId): number {
  return PIPELINE_STAGE_ORDER[stage];
}
