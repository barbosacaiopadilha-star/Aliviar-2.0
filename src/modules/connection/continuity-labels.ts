import type { ContinuityWorkItem } from "./continuity-worklist";
import type { ConnectionStatus, ContactMode } from "./types";

/**
 * A gramática da Caixa de Continuidade — como os fatos do domínio viram
 * frases na tela do Concierge.
 *
 * Existe como módulo, e não solto na página, por uma razão só: a regra mais
 * frágil desta área é linguística, e regra linguística que não é testável
 * volta na próxima edição. Aqui ela é função pura e tem teste.
 *
 * O que este módulo nunca produz: prazo, atraso, urgência, prioridade,
 * "sem resposta" como desfecho, nome de enum, ou qualquer julgamento sobre a
 * paciente. Todo rótulo descreve um fato registrado — e a ausência de fato é
 * dita como ausência, nunca como falha de alguém.
 */

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  DECISAO_REGISTRADA: "decisão registrada",
  CONTATO_INICIADO: "a paciente declarou ter iniciado o contato",
  PRIMEIRO_ATENDIMENTO_REALIZADO: "primeiro atendimento registrado",
  ENCERRADO_SEM_RELACIONAMENTO: "encerrado sem relacionamento",
};

export const CONTACT_MODE_LABELS: Record<ContactMode, string> = {
  CONTATO_DIRETO_ACOMPANHADO: "ela prefere entrar em contato diretamente",
  APROXIMACAO_INTERMEDIADA: "ela pediu que a Aliviar faça a aproximação",
};

/**
 * Quem responde pelo Case, em uma frase — lido de `cases.responsible_role`,
 * a fonte única. Nunca inferido de notificação, tentativa ou histórico:
 * responsabilidade tem um dono só, e é o Case quem o guarda.
 */
export function responsibilityLabel(responsibleRole: string | null): string {
  switch (responsibleRole) {
    case "concierge":
      return "Com você agora";
    case "curador_medico":
      return "Ainda com a Curadoria";
    case "atendente":
      return "Ainda no Atendimento";
    case "administrador":
      return "Com a administração";
    default:
      return "Sem responsável registrado";
  }
}

/**
 * A leitura de um Case da continuidade, separada em três dimensões que a
 * tela mostra ao mesmo tempo.
 *
 * `seen` e `pending` são independentes de propósito — é a ADR-044 em forma
 * de tipo: ler não executa. Nenhum caminho deste módulo remove item de
 * `pending` porque alguém viu o aviso.
 */
export type ContinuityReading = {
  /** O que ainda não aconteceu. Fato observável, nunca prazo nem cobrança. */
  pending: string[];
  /** Avisos que ninguém abriu ainda. */
  unseen: number;
  /** Alguém da Aliviar já viu algum aviso deste Case. */
  seen: boolean;
  /** Quantas tentativas de aproximação existem no histórico. */
  attempts: number;
};

export function readContinuity(item: ContinuityWorkItem): ContinuityReading {
  const pending: string[] = [];

  if (item.awaitingContactMode) pending.push("ela ainda não disse como quer começar");
  if (item.intermediatedWithoutOpenAttempt)
    pending.push("ela pediu a aproximação e não há tentativa aberta");
  if (item.attemptCreatedNotDispatched) pending.push("tentativa criada, ainda não despachada");
  // Ausência de resposta é ausência de fato — nunca "sem resposta há X dias".
  if (item.attemptDispatchedWithoutResponse)
    pending.push("tentativa despachada, nenhuma resposta registrada até agora");
  if (item.unavailabilityNeedsAction)
    pending.push("o profissional respondeu que não está disponível");

  return {
    pending,
    unseen: item.unreadNotifications,
    // `readButStillPending` já é a conjunção calculada pela projeção; aqui
    // basta saber que alguém viu — a pendência vive na própria lista acima.
    seen: item.readButStillPending,
    attempts: item.totalAttempts,
  };
}

/**
 * Guarda de vocabulário das superfícies de equipe. Espelha o que a Linguagem
 * proíbe nos fundos da casa: prazo, julgamento e língua de sistema.
 * Devolve o termo encontrado, ou null.
 */
const VOCABULARIO_PROIBIDO = [
  "atrasado",
  "atrasada",
  "vencido",
  "urgente",
  "sla",
  "prioridade alta",
  "prioridade média",
  "prioridade baixa",
  "sem resposta há",
  "aguardando resposta",
  "pronta para envio",
  "ticket",
  "workflow",
  "owner",
  "assignee",
  "atribuído",
  "claim",
  "operação concluída",
  "paciente inativa",
  "paciente difícil",
  "vínculo anterior",
  "requer atenção",
  "dados de demonstração",
] as const;

export function violatesTeamVocabulary(text: string): string | null {
  const lower = text.toLowerCase();
  for (const termo of VOCABULARIO_PROIBIDO) {
    if (lower.includes(termo)) return termo;
  }
  return null;
}
