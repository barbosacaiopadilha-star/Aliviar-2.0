/**
 * Camada de apresentação do Motor de Condução — rotas, rótulos de ação e
 * itens clicáveis. Não altera regras de negócio; apenas traduz ConductionState
 * em navegação operacional para o Curador.
 *
 * Desde a Simplificação da Jornada, esta camada traduz para as SETE etapas
 * (`journey.ts`). O Motor continua raciocinando em nove fases — a tradução
 * acontece só aqui, na fronteira com a tela.
 */

import {
  CURATOR_JOURNEY_DEFINITIONS,
  JOURNEY_ACTION_LABELS,
  journeyStepHref,
  stepOfPhase,
} from "./journey";
import type {
  ConductionState,
  CosPhaseId,
  PhaseStatus,
} from "./types";

/**
 * Rótulos de ação específicos — nunca genéricos como "Continuar".
 *
 * Uma fase leva ao rótulo da etapa que a contém: História e Caso levam ambas a
 * "Registrar o que entendi", porque é isso que o Curador vai fazer ao chegar lá.
 */
export const PHASE_ACTION_LABELS: Record<CosPhaseId, string> = {
  ACOLHIMENTO: JOURNEY_ACTION_LABELS.ACOLHER,
  HISTORIA: JOURNEY_ACTION_LABELS.COMPREENDER,
  CASO: JOURNEY_ACTION_LABELS.COMPREENDER,
  FILTROS: JOURNEY_ACTION_LABELS.CRITERIOS,
  PRIORIDADES: JOURNEY_ACTION_LABELS.CRITERIOS,
  VALIDACAO: JOURNEY_ACTION_LABELS.VALIDAR,
  CURADORIA_TECNICA: JOURNEY_ACTION_LABELS.COMPARAR,
  RELATORIO: JOURNEY_ACTION_LABELS.RELATORIO,
  DEVOLUTIVA: JOURNEY_ACTION_LABELS.FINALIZAR,
};

/** O nome que a tela dá a uma fase: o da etapa da jornada que a contém. */
export function phaseStepLabel(phase: CosPhaseId): string {
  return CURATOR_JOURNEY_DEFINITIONS[stepOfPhase(phase)].label;
}

/** Toda pendência de uma fase leva à etapa onde ela se resolve. */
export function phaseHref(caseId: string, phase: CosPhaseId): string {
  return journeyStepHref(caseId, stepOfPhase(phase));
}

export function isPhaseNavigable(status: PhaseStatus): boolean {
  return status !== "BLOQUEADA";
}

/** Rótulo do botão principal — descreve exatamente o que acontecerá. */
export function getPrimaryActionLabel(state: ConductionState): string {
  const blockingAlert = state.alerts.find((alert) => alert.severity === "bloqueio");
  if (blockingAlert) {
    return `Resolver em ${phaseStepLabel(blockingAlert.phase)}`;
  }
  return PHASE_ACTION_LABELS[state.nextStep.phase];
}

export type PendingActionItem = {
  id: string;
  description: string;
  phase: CosPhaseId;
  href: string | null;
  owner?: "CURADOR" | "PACIENTE" | "EQUIPE";
  kind: "missing" | "inconsistency" | "pendency";
};

const ownerLabels = {
  CURADOR: "com você",
  PACIENTE: "com o paciente",
  EQUIPE: "com a equipe",
} as const;

export function getOwnerLabel(owner: PendingActionItem["owner"]): string | null {
  return owner ? ownerLabels[owner] : null;
}

/** Monta itens de pendência a partir do estado de condução — sem alterar o motor. */
export function buildPendingActionItems(
  state: ConductionState,
  caseId: string,
): PendingActionItem[] {
  const items: PendingActionItem[] = [];
  const seen = new Set<string>();

  const add = (item: PendingActionItem) => {
    const key = `${item.kind}-${item.phase}-${item.description}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const description of state.missing) {
    add({
      id: `missing-${description}`,
      description,
      phase: state.currentPhase,
      href: phaseHref(caseId, state.currentPhase),
      kind: "missing",
    });
  }

  for (const entry of state.inconsistencies) {
    add({
      id: `inconsistency-${entry.code}`,
      description: entry.description,
      phase: entry.phase,
      href: phaseHref(caseId, entry.phase),
      kind: "inconsistency",
    });
  }

  for (const pendency of state.pendencies) {
    add({
      id: `pendency-${pendency.phase}-${pendency.description}`,
      description: pendency.description,
      phase: pendency.phase,
      href: pendency.owner === "PACIENTE" ? null : phaseHref(caseId, pendency.phase),
      owner: pendency.owner,
      kind: "pendency",
    });
  }

  return items;
}

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  CONCLUIDA: "Concluída",
  EM_ANDAMENTO: "Em andamento",
  DISPONIVEL: "Disponível",
  AGUARDANDO: "Aguardando",
  BLOQUEADA: "Bloqueada",
};
