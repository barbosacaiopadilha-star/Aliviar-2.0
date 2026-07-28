/**
 * RECONHECIMENTO DO PERFIL PELA PACIENTE — ADR-042.
 *
 * Um conceito só, com uma responsabilidade só:
 *
 *   "A paciente confirmou que o Perfil de Prioridades reflete o que foi
 *    compreendido durante a Consulta Inicial."
 *
 * O que ele NÃO é, e nunca mais será confundido com:
 *
 *   - não valida critérios — o Curador não cria critérios (ADR-039);
 *   - não valida o Método — o Método não depende de aprovação por Case;
 *   - não é etapa da investigação do Curador — é um ESTADO do Perfil;
 *   - não libera fase por regra artificial — a Mesa não bloqueia navegação.
 *
 * Por que existe como módulo próprio: `VALIDATED` carregava as duas coisas no
 * mesmo nome — "validar critérios construídos" e "a pessoa reconheceu o
 * Perfil como seu". A primeira morreu com o modelo de orçamento; a segunda é
 * o consentimento dela, e sem ele "qualquer análise seria a Aliviar decidindo
 * com aparência de método". Separar de verdade quer dizer: contrato próprio,
 * vocabulário próprio, e o `VALIDATED` reduzido a detalhe de armazenamento.
 *
 * Puro: sem React, sem banco.
 */

import type { PriorityProfileStatus } from "./types";

/**
 * O estado do reconhecimento, no vocabulário do domínio novo.
 *
 * `NAO_APLICAVEL` existe porque um Perfil substituído não está "não
 * reconhecido" — ele saiu de cena, e tratá-lo como pendente faria a Mesa
 * cobrar algo que não existe mais.
 */
export type ProfileAcknowledgement = "PENDENTE" | "RECONHECIDO" | "NAO_APLICAVEL";

export const ACKNOWLEDGEMENT_LABELS: Record<ProfileAcknowledgement, string> = {
  PENDENTE: "Ainda com a paciente",
  RECONHECIDO: "Perfil reconhecido pela paciente",
  NAO_APLICAVEL: "Perfil substituído",
};

/**
 * A frase que a Mesa mostra. Fala de reconhecimento, nunca de validação de
 * critérios — a diferença é o ponto inteiro deste módulo.
 */
export const ACKNOWLEDGEMENT_SENTENCES: Record<ProfileAcknowledgement, string> = {
  PENDENTE:
    "A paciente ainda não confirmou que este Perfil reflete o que vocês conversaram na Consulta Inicial.",
  RECONHECIDO:
    "A paciente confirmou que este Perfil reflete o que foi compreendido na Consulta Inicial.",
  NAO_APLICAVEL: "Este Perfil foi substituído por outro.",
};

/**
 * A ÚNICA tradução entre o armazenamento legado e o conceito novo.
 *
 * `priority_profiles.status` continua com `DRAFT | VALIDATED | SUPERSEDED`
 * porque migrar a coluna exigiria mexer em dado histórico sem ganho — mas
 * `VALIDATED` deixa de ser autoridade semântica: fora deste arquivo, o
 * domínio fala `RECONHECIDO`. Quem quiser saber se a paciente reconheceu
 * pergunta aqui, e não compara string com "VALIDATED".
 */
export function acknowledgementOf(
  status: PriorityProfileStatus | null | undefined,
): ProfileAcknowledgement {
  switch (status) {
    case "VALIDATED":
      return "RECONHECIDO";
    case "SUPERSEDED":
      return "NAO_APLICAVEL";
    default:
      return "PENDENTE";
  }
}

/** Açúcar de leitura para o caso mais comum. */
export function isProfileAcknowledged(
  status: PriorityProfileStatus | null | undefined,
): boolean {
  return acknowledgementOf(status) === "RECONHECIDO";
}

// ---------------------------------------------------------------------------
// Quando ela pode reconhecer
// ---------------------------------------------------------------------------

/**
 * O que a decisão devolve. Cada caso tem nome próprio porque cada um pede uma
 * resposta diferente da tela: "já está feito" não é erro, e "o Mapa ainda não
 * está completo" não é culpa dela.
 */
export type AcknowledgementDecision =
  | "PODE_RECONHECER"
  | "JA_RECONHECIDO"
  | "MAPA_INCOMPLETO"
  | "PERFIL_SUBSTITUIDO";

export const DECISION_MESSAGES: Record<AcknowledgementDecision, string> = {
  PODE_RECONHECER: "Este Perfil está pronto para o seu reconhecimento.",
  JA_RECONHECIDO: "Você já reconheceu este Perfil.",
  MAPA_INCOMPLETO:
    "O seu Perfil ainda está sendo construído junto com a Curadoria. Quando estiver completo, ele aparece aqui para você reconhecer.",
  PERFIL_SUBSTITUIDO:
    "Este Perfil foi substituído por outro. O reconhecimento acontece sobre o Perfil vigente.",
};

/**
 * A única regra que governa o ato — e note o que NÃO aparece aqui: soma de
 * pontos, `priority_weights`, `cruzamento_weights`, campo livre obrigatório.
 *
 * O reconhecimento depende de UMA coisa: o Mapa de Prioridades estar completo,
 * porque é o Mapa que ela reconhece. Amarrá-lo aos 100 pontos era pedir que
 * ela confirmasse uma conta que nunca foi dela.
 *
 * @param pendentes quantos subcritérios do catálogo ativo ainda não foram
 *        classificados. Zero significa Mapa completo.
 */
export function decideAcknowledgement(
  status: PriorityProfileStatus | null | undefined,
  pendentes: number,
): AcknowledgementDecision {
  const atual = acknowledgementOf(status);

  // Idempotência: reconhecer de novo não é erro, é um não-evento. A tela diz
  // que já está feito em vez de acusar falha por algo que ela fez certo.
  if (atual === "RECONHECIDO") return "JA_RECONHECIDO";
  if (atual === "NAO_APLICAVEL") return "PERFIL_SUBSTITUIDO";
  if (pendentes > 0) return "MAPA_INCOMPLETO";
  return "PODE_RECONHECER";
}

/**
 * O rótulo do botão. Nomeia o efeito — o que ela está confirmando — em vez de
 * "Validar", que pedia que ela avalizasse um método que não é dela.
 */
export const ACKNOWLEDGE_ACTION_LABEL = "Confirmar que este Perfil representa minhas prioridades";

/**
 * O que a confirmação congela, dito antes de acontecer (EXPERIENCE_BIBLE §
 * confirmações: sempre "o que vai acontecer", nunca "tem certeza?").
 *
 * A irreversibilidade não é herança do fluxo antigo: é a Invariante 28 da
 * Ontologia — Perfil reconhecido é imutável, e corrigir exige construir um
 * novo junto com ela. Auditada e mantida deliberadamente.
 */
export const ACKNOWLEDGE_CONFIRMATION =
  "Depois de confirmado, este Perfil não muda mais — corrigir exige construir um novo junto com a Curadoria. Confirmar?";
