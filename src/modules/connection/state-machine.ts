import type { ConnectionStatus } from "./types";

// Espelha exatamente a máquina de estados reforçada no banco
// (assert_connection_valid_transition, PR1 — migration
// 20260715000000_connection_records.sql) — mantida aqui para validação
// antecipada na aplicação, nunca como a única fonte de verdade (mesmo
// princípio já aplicado a cases/state-machine.ts, ADR-019).
const ALLOWED_TRANSITIONS: Record<ConnectionStatus, ConnectionStatus[]> = {
  DECISAO_REGISTRADA: [
    "CONTATO_INICIADO",
    "PRIMEIRO_ATENDIMENTO_REALIZADO",
    "ENCERRADO_SEM_RELACIONAMENTO",
  ],
  CONTATO_INICIADO: [
    "PRIMEIRO_ATENDIMENTO_REALIZADO",
    "ENCERRADO_SEM_RELACIONAMENTO",
  ],
  PRIMEIRO_ATENDIMENTO_REALIZADO: [],
  ENCERRADO_SEM_RELACIONAMENTO: [],
};

export function isValidConnectionTransition(
  from: ConnectionStatus,
  to: ConnectionStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedNextConnectionStatuses(
  from: ConnectionStatus,
): ConnectionStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isTerminalConnectionStatus(status: ConnectionStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
