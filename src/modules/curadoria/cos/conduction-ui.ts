/**
 * Camada de apresentação do Motor de Condução — rotas, rótulos de ação e
 * itens clicáveis. Não altera regras de negócio; apenas traduz ConductionState
 * em navegação operacional para o Curador.
 */

import type {
  ConductionState,
  CosPhaseId,
  PhaseStatus,
} from "./types";
import { COS_PHASE_LABELS } from "./types";

/** Rótulos de ação específicos — nunca genéricos como "Continuar". */
export const PHASE_ACTION_LABELS: Record<CosPhaseId, string> = {
  ACOLHIMENTO: "Revisar Acolhimento",
  HISTORIA: "Abrir História",
  CASO: "Abrir Caso",
  FILTROS: "Definir Filtros",
  PRIORIDADES: "Distribuir Prioridades",
  VALIDACAO: "Acompanhar Validação",
  CURADORIA_TECNICA: "Abrir Curadoria Técnica",
  RELATORIO: "Gerar Relatório",
  DEVOLUTIVA: "Registrar Devolutiva",
};

export function phaseHref(caseId: string, phase: CosPhaseId): string {
  return `/coa/curadoria/casos/${caseId}/${phase.toLowerCase()}`;
}

export function isPhaseNavigable(status: PhaseStatus): boolean {
  return status !== "BLOQUEADA";
}

/** Rótulo do botão principal — descreve exatamente o que acontecerá. */
export function getPrimaryActionLabel(state: ConductionState): string {
  const blockingAlert = state.alerts.find((alert) => alert.severity === "bloqueio");
  if (blockingAlert) {
    return `Resolver em ${COS_PHASE_LABELS[blockingAlert.phase]}`;
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
