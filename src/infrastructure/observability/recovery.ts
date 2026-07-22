export type RecoveryScenario =
  | "UPLOAD_FAILURE"
  | "PUBLICATION_FAILURE"
  | "AUTH_FAILURE"
  | "DATABASE_UNAVAILABLE";

export interface RecoveryStep {
  ordem: number;
  acao: string;
  objetivo: string;
}

export interface RecoveryProcedure {
  cenario: RecoveryScenario;
  titulo: string;
  preservar_consistencia: string[];
  passos: RecoveryStep[];
}

export const RECOVERY_PROCEDURES: RecoveryProcedure[] = [
  {
    cenario: "UPLOAD_FAILURE",
    titulo: "Falha de upload de documento",
    preservar_consistencia: [
      "Não marcar documento como RECEBIDO sem objeto no storage",
      "Remover objeto órfão se insert no banco falhar após upload",
      "Manter projeção da jornada alinhada ao banco",
    ],
    passos: [
      { ordem: 1, acao: "Identificar correlationId do upload", objetivo: "Localizar tentativa no audit trail" },
      { ordem: 2, acao: "Verificar storage e patient_documents", objetivo: "Confirmar se objeto existe" },
      { ordem: 3, acao: "Se storage ok e DB ausente, reexecutar projeção", objetivo: "Restaurar visibilidade na jornada" },
      { ordem: 4, acao: "Se DB ok e storage ausente, solicitar reenvio ao paciente", objetivo: "Evitar referência quebrada" },
    ],
  },
  {
    cenario: "PUBLICATION_FAILURE",
    titulo: "Falha de publicação de entrega",
    preservar_consistencia: [
      "Entrega publicada somente após aprovação",
      "Não expor rascunho ao paciente",
      "Manter workspace do curador como fonte de verdade",
    ],
    passos: [
      { ordem: 1, acao: "Consultar audit trail PUBLICACAO", objetivo: "Verificar último resultado" },
      { ordem: 2, acao: "Validar modo do rascunho (APROVADO)", objetivo: "Garantir pré-condição" },
      { ordem: 3, acao: "Reexecutar publicação via API", objetivo: "Completar transição" },
      { ordem: 4, acao: "Confirmar etapa ENTREGA na jornada do paciente", objetivo: "Validar experiência" },
    ],
  },
  {
    cenario: "AUTH_FAILURE",
    titulo: "Falha de autenticação",
    preservar_consistencia: [
      "Não vincular paciente sem sessão válida",
      "Não expor UUIDs em mensagens ao usuário",
      "Invalidar sessão comprometida",
    ],
    passos: [
      { ordem: 1, acao: "Consultar logs LOGIN com correlationId", objetivo: "Identificar causa" },
      { ordem: 2, acao: "Verificar vínculo patients.auth_user_id", objetivo: "Confirmar associação" },
      { ordem: 3, acao: "Reemitir magic link se OTP expirou", objetivo: "Restabelecer acesso" },
      { ordem: 4, acao: "Encerrar sessões antigas se necessário", objetivo: "Evitar estado inconsistente" },
    ],
  },
  {
    cenario: "DATABASE_UNAVAILABLE",
    titulo: "Indisponibilidade temporária do banco",
    preservar_consistencia: [
      "Não confirmar operações sem persistência",
      "Retornar erro explícito ao cliente",
      "Não duplicar eventos de auditoria em retry cego",
    ],
    passos: [
      { ordem: 1, acao: "Executar GET /api/v1/health", objetivo: "Confirmar componentes afetados" },
      { ordem: 2, acao: "Pausar operações de escrita não idempotentes", objetivo: "Evitar divergência" },
      { ordem: 3, acao: "Aguardar recuperação do banco", objetivo: "Restaurar disponibilidade" },
      { ordem: 4, acao: "Reprocessar operações com mesmo correlationId", objetivo: "Rastrear retries" },
    ],
  },
];

export function getRecoveryProcedure(cenario: RecoveryScenario): RecoveryProcedure {
  const found = RECOVERY_PROCEDURES.find((p) => p.cenario === cenario);
  if (!found) {
    throw new Error(`recovery_procedure_not_found:${cenario}`);
  }
  return found;
}

export function shouldRetryOperation(input: {
  cenario: RecoveryScenario;
  attempts: number;
  maxAttempts: number;
}): boolean {
  if (input.attempts >= input.maxAttempts) return false;
  return input.cenario === "DATABASE_UNAVAILABLE" || input.cenario === "AUTH_FAILURE";
}
