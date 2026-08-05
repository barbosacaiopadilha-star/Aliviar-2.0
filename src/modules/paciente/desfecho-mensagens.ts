import { DECISION_MESSAGES } from "@/modules/curadoria/reconhecimento-do-perfil";

/**
 * AS FRASES DOS RETORNOS DA RPC — Etapa 2C (C8/C9).
 *
 * @metodo PP-03 §5.2 — retornos nomeados, para que a superfície distinga
 *         "não autorizado" de "já respondido" sem interpretar mensagem
 *
 * Por que existe como módulo puro, fora da action: um arquivo `"use server"`
 * só pode exportar funções async, e estas frases precisam ser lidas por teste
 * e por tela sem carregar o cliente do servidor.
 *
 * A regra que este arquivo carrega: **nenhum retorno específico cai no
 * genérico**. Cada estado nomeado pelo banco tem uma frase própria, e nenhuma
 * delas acusa — o conceito que não existe, a tradução que não houve e o Perfil
 * substituído são estados do trabalho, não erros dela.
 */

/**
 * O contrato do PP-03 §5.2, mais os dois acréscimos já verificados:
 * `ESTADO_INVALIDO` (PP-03A) e `PERFIL_SUBSTITUIDO` (PP-03B).
 */
export const RETORNOS_DA_RPC = [
  "NAO_AUTORIZADO",
  "ESTADO_INVALIDO",
  "TEXTO_OBRIGATORIO",
  "CONCEITO_INEXISTENTE",
  "NAO_TRADUZIDO",
  "JA_RESPONDIDO",
  "PERFIL_JA_RECONHECIDO",
  "PERFIL_SUBSTITUIDO",
] as const;

export type RetornoDaRPC = (typeof RETORNOS_DA_RPC)[number];

export const MENSAGENS_DO_DESFECHO: Record<RetornoDaRPC, string> = {
  NAO_AUTORIZADO: "Este Perfil não é seu.",
  ESTADO_INVALIDO:
    "Essa resposta não é uma das opções desta tela. Escolha reconhecer, corrigir ou discordar.",
  TEXTO_OBRIGATORIO:
    "Para corrigir ou discordar, conte o que está diferente — é o que a Curadoria precisa saber.",
  CONCEITO_INEXISTENTE: "Este ponto ainda não faz parte do seu Perfil.",
  NAO_TRADUZIDO:
    "Aqui não houve tradução de ninguém — esta é a sua própria resposta, do jeito que você deu.",
  JA_RESPONDIDO: "Você já respondeu sobre este ponto. Para mudar, fale com seu Curador.",
  PERFIL_JA_RECONHECIDO:
    "Você já reconheceu este Perfil, e ele não muda mais. Para corrigir, é preciso construir um novo junto com a Curadoria.",
  // C8 — a frase é a do domínio, não uma nova: o Perfil que saiu de cena não
  // está pendente dela, e o ato acontece sobre o vigente.
  PERFIL_SUBSTITUIDO: DECISION_MESSAGES.PERFIL_SUBSTITUIDO,
};

/** A última linha de defesa — usada só para o que a RPC nunca nomeou. */
export const MENSAGEM_GENERICA = "Não foi possível registrar agora. Tente de novo.";

export function mensagemDoRetorno(retorno: string): string {
  return MENSAGENS_DO_DESFECHO[retorno as RetornoDaRPC] ?? MENSAGEM_GENERICA;
}
