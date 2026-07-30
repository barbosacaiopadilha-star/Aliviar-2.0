/**
 * ESTADO DA INFORMAÇÃO — a diferença entre não saber e saber que não.
 *
 * Por que existe: `null` responde a pergunta errada. Um campo vazio pode
 * significar "ela não tem", "não perguntamos", "não se aplica", "ela preferiu
 * não dizer" ou "as duas fontes discordam" — e tratar os cinco como a mesma
 * coisa produz o erro mais caro que uma plataforma de saúde pode cometer:
 * transformar ausência de informação em informação negativa.
 *
 * Absorvido de `src/modules/ace/core/information-state.ts`. A disciplina nunca
 * foi do ACE.
 *
 * ------------------------------------------------------------------------
 * RELAÇÃO COM A CLASSE DE DADO
 * ------------------------------------------------------------------------
 * Não confundir com a classificação de dado que alguns módulos usam (fato,
 * preferência, interpretação). São eixos diferentes e complementares:
 *
 *   classe de dado  → que NATUREZA tem esta informação
 *   estado          → o QUANTO dela se sabe, e por quê
 *
 * "Ela prefere consultas pela manhã" é uma preferência (classe) conhecida
 * (estado). "Não perguntamos o horário" é a mesma classe, estado diferente.
 * Fundir os dois eixos perderia informação — por isso esta camada não conhece
 * nem menciona classes.
 *
 * Não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem Administrador.
 * Conhece informação.
 */

export const INFORMATION_STATES = [
  /** Existe resposta, e ela é conhecida. */
  "conhecido",
  /** A pessoa declarou que não possui / não é o caso. É resposta, não ausência. */
  "ausencia_declarada",
  /** Perguntamos, e não se sabe. */
  "desconhecido",
  /** Nunca foi perguntado. Ausência de pergunta, não de resposta. */
  "nao_perguntado",
  /** Foi perguntado e a pessoa não respondeu — inclusive por escolha. */
  "sem_resposta",
  /** A pergunta não faz sentido neste caso. */
  "nao_se_aplica",
  /** Duas fontes discordam. Nunca resolver em silêncio. */
  "conflitante",
  /** Há valor, mas precisa ser confirmado com a pessoa antes de valer. */
  "requer_confirmacao",
  /** Determinado pela natureza do caso, não por alguém. */
  "determinado_pelo_caso",
  /** Determinado por decisão registrada de quem conduz. */
  "determinado_por_quem_conduz",
] as const;

export type InformationState = (typeof INFORMATION_STATES)[number];

/** De onde a informação veio. Toda informação tem origem — nunca "apareceu". */
export const EVIDENCE_SOURCES = [
  "declaracao_da_pessoa",
  "declaracao_de_quem_conduz",
  "formulario",
  "interacao",
  "documento",
  "inferencia_de_modelo",
  "regra_deterministica",
] as const;

export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export type Evidence = {
  readonly source: EvidenceSource;
  /** O trecho literal que originou o valor. Preservar a fala importa mais que resumir. */
  readonly excerpt?: string;
  readonly identifier?: string;
  readonly author?: string;
  readonly at?: string;
  /**
   * Confiança declarada pela origem, quando ela tem uma. Nunca é score de
   * qualidade da pessoa nem entra em cálculo de decisão.
   */
  readonly confidence?: number;
  /** Um humano olhou e confirmou. Muda tudo sobre quanto se pode apoiar nisto. */
  readonly confirmedByHuman?: boolean;
};

/** Um valor que carrega o quanto se sabe sobre ele. */
export type Known<T> = {
  readonly value: T | null;
  readonly state: InformationState;
  readonly evidence?: Evidence;
  readonly updatedAt?: string;
};

/**
 * Estados que NÃO devem gerar pendência.
 *
 * "Ela declarou que não tem plano de saúde" é resposta completa: cobrar de novo
 * seria fazer a pessoa repetir o que já disse. É a diferença entre um sistema
 * que escuta e um que insiste.
 */
const SETTLED: ReadonlySet<InformationState> = new Set<InformationState>([
  "conhecido",
  "ausencia_declarada",
  "nao_se_aplica",
  "determinado_pelo_caso",
  "determinado_por_quem_conduz",
]);

/** A informação está resolvida — nada a perguntar. */
export function isSettled(state: InformationState): boolean {
  return SETTLED.has(state);
}

/** Falta alguma coisa, e vale perguntar. */
export function isPending(state: InformationState): boolean {
  return !SETTLED.has(state);
}

/**
 * Exige atenção humana antes de ser usada — nunca deve alimentar nada
 * automaticamente.
 */
export function needsHumanAttention(state: InformationState): boolean {
  return state === "conflitante" || state === "requer_confirmacao";
}

/**
 * O valor só quando ele é seguro de usar.
 *
 * `requer_confirmacao` e `conflitante` devolvem `null` de propósito: têm valor,
 * mas usá-lo sem passar por um humano é exatamente o erro que esta camada
 * existe para impedir.
 */
export function usableValue<T>(known: Known<T>): T | null {
  if (needsHumanAttention(known.state)) return null;
  return isSettled(known.state) ? known.value : null;
}

/** Constrói um valor conhecido, com origem obrigatória. */
export function known<T>(value: T, evidence: Evidence, at?: string): Known<T> {
  return { value, state: "conhecido", evidence, updatedAt: at };
}

/** Constrói uma ausência, sem fingir que é um "não". */
export function absent<T>(state: InformationState, evidence?: Evidence, at?: string): Known<T> {
  return { value: null, state, evidence, updatedAt: at };
}

/**
 * Registra que duas origens discordam.
 *
 * Não escolhe entre elas — resolver conflito é ato humano. Preserva as duas
 * evidências para que quem for decidir veja o que cada lado disse.
 */
export function conflicting<T>(
  candidates: ReadonlyArray<{ value: T; evidence: Evidence }>,
  at?: string,
): Known<T> & { readonly candidates: ReadonlyArray<{ value: T; evidence: Evidence }> } {
  return {
    value: null,
    state: "conflitante",
    updatedAt: at,
    candidates,
  };
}
