// Responsabilidade operacional do Case — os três níveis humanos.
//
// @metodo Correção de Domínio §2 — Atendente (abre), Curador (conduz), Concierge (acompanha)
// @metodo Correção de Domínio §3 — existe apenas Case; ele muda de responsável, nunca de identidade
//
// Este arquivo é puro: nenhuma consulta, nenhum efeito. Ele espelha, em
// TypeScript, exatamente as mesmas regras que `curadoria.transfer_case_
// responsibility()` impõe no banco. A duplicação é deliberada e tem um motivo:
// o banco é quem garante, a UI é quem explica. Se um dia divergirem, o banco
// vence e o teste `responsibility.test.ts` quebra — que é o objetivo.

/**
 * Os três níveis humanos. `crm` não está aqui e nunca estará: o CRM é a
 * plataforma onde o trabalho acontece, não alguém que trabalha. `curadoria`
 * também não: é o processo que o Curador executa dentro do Case.
 */
export const RESPONSIBLE_ROLES = ["atendente", "curador_medico", "concierge"] as const;

export type ResponsibleRole = (typeof RESPONSIBLE_ROLES)[number];

export const RESPONSIBLE_ROLE_LABELS: Record<ResponsibleRole, string> = {
  atendente: "Atendente",
  curador_medico: "Curador",
  concierge: "Concierge",
};

/** O que cada nível faz com o Case. Usado nas telas de transferência. */
export const RESPONSIBLE_ROLE_MISSIONS: Record<ResponsibleRole, string> = {
  atendente: "Recebe e qualifica o contato, abre o Case e encaminha ao Curador.",
  curador_medico: "Conduz a Consulta Inicial e a Curadoria, entrega o relatório e encaminha ao Concierge.",
  concierge: "Acompanha a escolha do médico, o agendamento e os retornos até o encerramento.",
};

export function isResponsibleRole(value: unknown): value is ResponsibleRole {
  return typeof value === "string" && (RESPONSIBLE_ROLES as readonly string[]).includes(value);
}

/**
 * A jornada oficial. `null` é o Case ainda sem responsável — ou porque acabou
 * de nascer, ou porque é anterior à Correção de Domínio.
 *
 * `null → curador_medico` existe por uma razão operacional concreta, não por
 * conveniência: hoje não há nenhuma pessoa com papel `atendente` em produção.
 * Fechar esse caminho pararia a operação real para impor um organograma que
 * ainda não tem gente dentro. Quando o primeiro Atendente existir, esta
 * transição deve ser reavaliada.
 */
const NORMAL_TRANSITIONS: Record<string, readonly ResponsibleRole[]> = {
  __none__: ["atendente", "curador_medico"],
  atendente: ["curador_medico"],
  curador_medico: ["concierge"],
  concierge: [],
};

export function isNormalTransition(from: ResponsibleRole | null, to: ResponsibleRole): boolean {
  return NORMAL_TRANSITIONS[from ?? "__none__"].includes(to);
}

export type ResponsibilityState = {
  responsibleId: string | null;
  responsibleRole: ResponsibleRole | null;
};

export type TransferInput = {
  current: ResponsibilityState;
  newResponsibleId: string;
  newRole: ResponsibleRole;
  reason: string;
  /** Papéis que o destinatário realmente tem. Ter o papel não é ser indicado para ele. */
  newResponsibleRoles: readonly string[];
  actorIsAdmin: boolean;
};

export type TransferVerdict =
  /** Nada a fazer: já é esse responsável nesse papel. Não é erro, e não gera histórico. */
  | { outcome: "unchanged" }
  | { outcome: "allowed" }
  | { outcome: "rejected"; reason: string };

/**
 * Decide se a passagem de bastão pode acontecer.
 *
 * A ordem das checagens não é arbitrária. A idempotência vem antes de tudo
 * porque "transferir para quem já é o responsável" é um duplo-clique, não uma
 * violação — e um duplo-clique não deve produzir mensagem de erro.
 */
export function evaluateTransfer(input: TransferInput): TransferVerdict {
  const { current, newResponsibleId, newRole, reason, newResponsibleRoles, actorIsAdmin } = input;

  if (current.responsibleId === newResponsibleId && current.responsibleRole === newRole) {
    return { outcome: "unchanged" };
  }

  if (reason.trim().length === 0) {
    return { outcome: "rejected", reason: "Explique por que o Case está mudando de responsável." };
  }

  if (!newResponsibleRoles.includes(newRole)) {
    return {
      outcome: "rejected",
      reason: `Quem vai receber o Case não tem o papel de ${RESPONSIBLE_ROLE_LABELS[newRole]}.`,
    };
  }

  if (!actorIsAdmin && !isNormalTransition(current.responsibleRole, newRole)) {
    const origem = current.responsibleRole
      ? RESPONSIBLE_ROLE_LABELS[current.responsibleRole]
      : "Case sem responsável";
    return {
      outcome: "rejected",
      reason: `Passar de ${origem} para ${RESPONSIBLE_ROLE_LABELS[newRole]} sai da jornada normal. Um administrador precisa registrar essa exceção.`,
    };
  }

  return { outcome: "allowed" };
}

/**
 * Quem pode entregar o Case: quem o tem na mão hoje, ou o administrador.
 *
 * `assignedCuratorId` entra como vínculo histórico, não como autoridade
 * paralela: os Cases anteriores à Correção de Domínio têm `responsibleId`
 * nulo, e o Curador que já os conduz não pode ficar trancado do lado de fora.
 * Assim que o Case ganha responsável atual, o campo histórico deixa de contar.
 */
export function canTransfer(params: {
  actorId: string;
  actorIsAdmin: boolean;
  current: ResponsibilityState;
  assignedCuratorId: string | null;
}): boolean {
  const { actorId, actorIsAdmin, current, assignedCuratorId } = params;
  if (actorIsAdmin) return true;
  if (current.responsibleId !== null) return current.responsibleId === actorId;
  return assignedCuratorId !== null && assignedCuratorId === actorId;
}

/** Um registro do histórico append-only. Espelha `curadoria.case_responsibility_changes`. */
export type ResponsibilityChange = {
  id: string;
  caseId: string;
  previousResponsibleId: string | null;
  previousRole: ResponsibleRole | null;
  newResponsibleId: string;
  newRole: ResponsibleRole;
  changedBy: string;
  reason: string;
  changedAt: string;
};
