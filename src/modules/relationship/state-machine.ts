// RELATIONSHIP ENGINE — MVP — PR2. Máquina de estados definitiva
// (docs/architecture/DOMAIN_RELATIONSHIP.md, Veredito A, Fase 4.1) —
// exatamente dois estados, ATIVO e ENCERRADO, nenhum outro.
// REABERTURA_OBSERVADA nunca aparece aqui porque nunca altera
// relationship_records.status (é só um evento adicional contra um
// registro já terminal) — ver canRegisterReopening, que consulta
// terminalidade, nunca uma transição de status.
//
// [CORRIGIDO — Fase 6.1] PAUSADO e a dupla de estados terminais
// (ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO) foram removidos —
// construídos sobre uma teoria anterior à Fase 4.1, que rejeitou
// explicitamente PAUSADO como estado e exigiu um único ENCERRADO.

import {
  RELATIONSHIP_TERMINAL_STATUSES,
  type RelationshipStatus,
} from "./types";

const ALLOWED_TRANSITIONS: Record<
  RelationshipStatus,
  readonly RelationshipStatus[]
> = {
  ATIVO: ["ENCERRADO"],
  ENCERRADO: [],
};

export function isTerminalRelationshipStatus(
  status: RelationshipStatus,
): boolean {
  return (RELATIONSHIP_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function allowedNextRelationshipStatuses(
  status: RelationshipStatus,
): readonly RelationshipStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

export function isValidRelationshipTransition(
  from: RelationshipStatus,
  to: RelationshipStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// Encerramento (planejado ou por interrupção — o motivo vive no evento,
// nunca no estado) é possível a partir de ATIVO — nunca a partir de um
// estado já terminal.
export function canClose(status: RelationshipStatus): boolean {
  return status === "ATIVO";
}

export function canRegisterInterruption(status: RelationshipStatus): boolean {
  return status === "ATIVO";
}

// Reabertura nunca é uma transição de estado — só é possível registrá-la
// contra um Relationship já terminal (Fase 3/Etapa 4: "ocorre somente
// sobre Relationship terminal").
export function canRegisterReopening(status: RelationshipStatus): boolean {
  return isTerminalRelationshipStatus(status);
}
