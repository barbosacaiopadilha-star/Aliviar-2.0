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
