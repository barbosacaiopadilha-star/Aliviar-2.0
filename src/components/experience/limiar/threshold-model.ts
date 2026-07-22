/**
 * Capítulo Zero — primeira frase do limiar.
 *
 * Escolhida após dezenas de alternativas. Une o que o visitante já vê
 * (luz quente) ao que precisa sentir: alguém deixou a casa acordada.
 */
export const THRESHOLD_FIRST_LINE = "A luz ficou acesa.";

/**
 * Alternativas consideradas e descartadas.
 * Critério: aliviar, não impressionar; lugar habitado, não interface.
 */
export const THRESHOLD_LINE_ALTERNATIVES = [
  "Olá,",
  "Você chegou.",
  "Pode entrar.",
  "Pode ficar.",
  "Pode ficar um pouco.",
  "Não há pressa.",
  "Sem pressa.",
  "Estamos aqui.",
  "Há alguém aqui.",
  "Alguém está aqui.",
  "Ainda estamos aqui.",
  "Ainda estamos acordados.",
  "A porta estava aberta.",
  "A casa ainda está acordada.",
  "Deixamos a luz acesa.",
  "A luz ficou acesa para você.",
  "A luz estava acesa.",
  "Tudo bem chegar agora.",
  "Está tudo bem chegar agora.",
  "Que bom que você veio.",
  "Você não precisa ir embora.",
  "Não precisa correr.",
  "Não precisa ter pressa.",
  "Fique à vontade.",
  "Respire um pouco.",
  "Hoje pode ser só isso: chegar.",
  "Bem-vindo.",
  "Chegou na hora certa.",
  "Demorou, mas chegou.",
  "Não está sozinho nesta hora.",
  "Pode descansar um pouco.",
  "Você pode descansar.",
  "Estávamos esperando.",
  "A noite é longa.",
  "Entre.",
  "Fique.",
] as const;

/** Palavras proibidas na experiência pública (Creative Direction 1.0). */
export const THRESHOLD_FORBIDDEN_WORDS = [
  "lead",
  "usuário",
  "ticket",
  "chamado",
  "pipeline",
  "funil",
  "conversão",
  "aguarde",
  "status",
  "checklist",
  "dashboard",
  "ranking",
  "score",
  "algoritmo",
  "garantimos",
  "cura",
  "promoção",
  "oferta",
  "compre",
  "cadastre-se",
] as const;
