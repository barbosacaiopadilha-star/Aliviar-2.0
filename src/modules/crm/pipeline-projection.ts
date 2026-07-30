import type { PipelineStage } from "./pipeline";

/**
 * PROJEÇÃO DO PIPELINE — Convergência de Domínio, B2 (2026-07-25).
 *
 * A etapa exibida no funil do CRM tem DUAS origens, nunca misturadas:
 *
 *  1. FASE DE LEAD (Atendimento): a etapa é estado próprio do lead,
 *     editável pelo Atendente em `crm_contacts.pipeline_stage`. São as
 *     LEAD_EDITABLE_STAGES abaixo.
 *
 *  2. FASE DE CASE (da entrega ao Curador em diante): a etapa é DERIVADA
 *     dos fatos canônicos do Case — nunca editada. Cada regra cita o fato
 *     que a justifica. Escrever uma etapa desta fase é proibido em
 *     `changePipelineStage` (o segundo estado que a Correção de Domínio
 *     baniu).
 *
 * Estado desconhecido NUNCA é convertido em silêncio: a projeção devolve
 * `{ kind: "indeterminada" }` com o motivo, e a interface mostra isso como
 * indeterminação — a mesma regra do dashboard ("não sei" ≠ zero).
 */

/** Etapas que pertencem ao LEAD e seguem editáveis pelo Atendente. */
export const LEAD_EDITABLE_STAGES: PipelineStage[] = [
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

/** Fatos canônicos do Case usados pela projeção — nada além disto. */
export type CaseProjectionFacts = {
  status: string;
  responsibleRole: "atendente" | "curador_medico" | "concierge" | null;
  /** Consulta Inicial iniciada (cases.started_at). */
  startedAt: string | null;
  closedAt: string | null;
  /**
   * Existe uma Curadoria validamente entregue para este Case, segundo o
   * contrato canônico — independente de ter vindo da Curadoria do Método ou do
   * motor antigo. Esta projeção nunca sabe qual das duas.
   */
  delivered: boolean;
};

export type PipelineProjection =
  | { kind: "lead"; reason: string }
  | { kind: "case"; stage: PipelineStage; reason: string }
  | { kind: "indeterminada"; reason: string };

/**
 * Deriva a etapa exibida. Regras em ordem, determinísticas; a primeira que
 * casa vence. Toda regra carrega a justificativa que a auditoria vai ler.
 */
export function projectPipelineStage(caseFacts: CaseProjectionFacts | null): PipelineProjection {
  if (!caseFacts) {
    return {
      kind: "lead",
      reason: "Sem Case aberto: a etapa é o estado próprio do lead, editável pelo Atendente.",
    };
  }

  const { status, responsibleRole, startedAt, closedAt, delivered } = caseFacts;

  if (closedAt || status === "CLOSED") {
    return { kind: "case", stage: "completed", reason: "Case encerrado (closed_at/CLOSED)." };
  }

  if (status === "CANCELLED") {
    // Cancelamento não tem etapa de funil correspondente — dizer "completed"
    // inventaria um desfecho que não houve.
    return { kind: "indeterminada", reason: "Case cancelado: o funil não tem etapa para cancelamento." };
  }

  if (responsibleRole === "concierge") {
    return delivered
      ? { kind: "case", stage: "scheduling_support", reason: "Com o Concierge após a entrega (responsible_role + entrega reconhecida)." }
      : { kind: "case", stage: "doctor_selected", reason: "Com o Concierge (responsible_role) antes do registro de entrega." };
  }

  if (delivered) {
    return { kind: "case", stage: "report_delivered", reason: "Curadoria entregue ao paciente (contrato canônico de entrega)." };
  }

  if (responsibleRole === "curador_medico") {
    return startedAt
      ? { kind: "case", stage: "curation_in_progress", reason: "Curador responsável e Consulta iniciada (started_at)." }
      : { kind: "case", stage: "sent_to_curator", reason: "Curador responsável, Consulta ainda não iniciada (started_at nulo)." };
  }

  if (responsibleRole === "atendente") {
    return {
      kind: "lead",
      reason: "Case aberto e ainda com o Atendente: a etapa segue a fase de lead até o encaminhamento.",
    };
  }

  // responsibleRole nulo: Cases anteriores à Correção de Domínio. O vínculo
  // histórico é do Curador designado — mas ISSO não está nos fatos desta
  // projeção, e adivinhar entre "sent" e "in_progress" seria inventar.
  if (responsibleRole === null && startedAt) {
    return { kind: "case", stage: "curation_in_progress", reason: "Sem responsável registrado (pré-Correção), mas Consulta iniciada (started_at)." };
  }

  return {
    kind: "indeterminada",
    reason: `Combinação sem regra: status=${status}, responsável=${responsibleRole ?? "nenhum"}, started=${Boolean(startedAt)}. Tratar explicitamente antes de exibir.`,
  };
}
