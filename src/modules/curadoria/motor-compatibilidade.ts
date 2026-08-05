/**
 * MOTOR DE COMPATIBILIDADE — compara duas declarações, não interpreta nada.
 *
 * @metodo Fundamentos §13 — P14: o Motor organiza; a decisão é do Curador
 * @metodo ADR-039 — o Case declara quanto cada subcritério importa
 * @metodo ADR-040 — o profissional declara se a característica está presente
 *
 *   Importância do Case  ×  Estado do Profissional  →  Compatibilidade
 *
 * Sem texto livre, sem IA, sem inferência. O cruzamento é possível porque os
 * dois lados apontam para o MESMO `subcriterion_id` — nunca se compara por
 * nome, e este módulo não conhece rótulo nenhum.
 *
 * O que o Motor NUNCA faz: escolher médico, ordenar, eliminar, pontuar,
 * somar ou devolver porcentagem. Ele organiza evidência para alguém decidir.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import type { ImportanceLevel } from "./mapa-prioridades";
import type { SubcriterionStatus } from "./mapa-profissional";
import {
  apenasConceitosDoMotor,
  ConceitoForaDoMotorError,
  participaDoMotor,
} from "./participacao-no-motor";

// ---------------------------------------------------------------------------
// Os quatro resultados
// ---------------------------------------------------------------------------

export const COMPATIBILITY_RESULTS = [
  "ALTA_COMPATIBILIDADE",
  "MEDIA_COMPATIBILIDADE",
  "LACUNA_DE_INFORMACAO",
  "NAO_RELEVANTE",
] as const;

export type CompatibilityResult = (typeof COMPATIBILITY_RESULTS)[number];

export const COMPATIBILITY_LABELS: Record<CompatibilityResult, string> = {
  ALTA_COMPATIBILIDADE: "Alta compatibilidade",
  MEDIA_COMPATIBILIDADE: "Média compatibilidade",
  LACUNA_DE_INFORMACAO: "Lacuna de informação",
  NAO_RELEVANTE: "Não relevante neste caso",
};

// ---------------------------------------------------------------------------
// A matriz
// ---------------------------------------------------------------------------

/**
 * As quinze combinações. Nove vieram escritas na definição do Modelo; seis
 * foram derivadas dos princípios abaixo e estão marcadas — se alguma delas
 * contrariar a intenção, é aqui que se corrige, num lugar só.
 *
 * PRINCÍPIO 1 — "não influencia" encerra o assunto.
 *   Se o subcritério não pesa neste caso, nada que o profissional tenha ou
 *   deixe de ter muda isso. `NAO_INFLUENCIA` devolve `NAO_RELEVANTE` nos três
 *   estados. (Um dos três estava escrito; os outros dois seguem dele.)
 *
 * PRINCÍPIO 2 — ausência nunca elimina, e nunca vira alta.
 *   A definição é explícita: "muito importante" + "não confirmado" é MÉDIA, e
 *   não incompatível — a falta de uma característica reduz aderência naquele
 *   subcritério e mais nada. Se a importância máxima com ausência já para em
 *   MÉDIA, nenhuma importância menor pode passar disso. `NAO_CONFIRMADO`
 *   devolve MÉDIA em toda a escala, exceto sob o Princípio 1.
 *
 * PRINCÍPIO 3 — lacuna aparece como lacuna.
 *   A definição marca LACUNA para as três importâncias mais altas. Estender a
 *   "pouco importante" é a leitura conservadora: deixar a importância baixa
 *   silenciar um "não sei" seria o Motor decidindo o que o Curador precisa
 *   saber. Quem escolhe ignorar a lacuna é ele, olhando para ela.
 */
const MATRIZ: Record<ImportanceLevel, Record<SubcriterionStatus, CompatibilityResult>> = {
  MUITO_IMPORTANTE: {
    CONFIRMADO: "ALTA_COMPATIBILIDADE", //     definido
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // definido
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  definido
  },
  IMPORTANTE: {
    CONFIRMADO: "ALTA_COMPATIBILIDADE", //     definido
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // derivado — princípio 2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  definido
  },
  RELEVANTE: {
    CONFIRMADO: "MEDIA_COMPATIBILIDADE", //    definido
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // derivado — princípio 2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  definido
  },
  POUCO_IMPORTANTE: {
    CONFIRMADO: "MEDIA_COMPATIBILIDADE", //    definido
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // derivado — princípio 2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  derivado — princípio 3
  },
  NAO_INFLUENCIA: {
    CONFIRMADO: "NAO_RELEVANTE", //            definido
    NAO_CONFIRMADO: "NAO_RELEVANTE", //        derivado — princípio 1
    NAO_INFORMADO: "NAO_RELEVANTE", //         derivado — princípio 1
  },
};

/** Uma combinação, um resultado. Sem exceção e sem estado intermediário. */
export function crossOne(
  importance: ImportanceLevel,
  status: SubcriterionStatus,
): CompatibilityResult {
  return MATRIZ[importance][status];
}

// ---------------------------------------------------------------------------
// O cruzamento de um profissional
// ---------------------------------------------------------------------------

export type CompatibilityRow = {
  subcriterionCode: string;
  importance: ImportanceLevel;
  /**
   * `null` quando o profissional não tem declaração para este subcritério.
   *
   * ADR-040: ausência de registro é diferente de `NAO_INFORMADO`. As duas
   * caem em `LACUNA_DE_INFORMACAO` — mas o Curador precisa saber se alguém
   * olhou e não soube, ou se ninguém olhou ainda. Por isso o estado vem
   * junto, e não some dentro do resultado.
   */
  status: SubcriterionStatus | null;
  result: CompatibilityResult;
};

export type CompatibilitySummary = {
  totalSubcriteria: number;
  highCompatibility: number;
  mediumCompatibility: number;
  informationGaps: number;
  notRelevant: number;
  /**
   * Das lacunas, quantas são subcritério que ninguém tratou no cadastro do
   * profissional — distinto de "analisado, sem informação".
   */
  gapsWithoutAnyRecord: number;
  /**
   * Subcritérios que o Case ainda não declarou. NÃO entram no cruzamento:
   * sem importância declarada não há o que comparar, e isso é um fato sobre
   * o Case, não sobre o profissional.
   */
  notDeclaredByCase: number;
};

export type CompatibilityReading = {
  rows: CompatibilityRow[];
  summary: CompatibilitySummary;
};

/**
 * ITEM 1.1 — GUARDA DA CÉLULA (segundo nível).
 *
 * `crossOne` é a matriz da ADR-041 e continua sendo o que sempre foi: uma
 * função de (importância, estado) para um dos quatro resultados. Ela não sabe
 * de conceito, e não deve saber — congelada, quinze células, sem exceção.
 *
 * A guarda vive AQUI, uma camada acima: nenhuma célula nasce sem o conceito ser
 * nomeado, e conceito `NUNCA` para o processo em vez de devolver resultado.
 *
 * Por que dois níveis, se a entrada já filtra: a entrada protege o caminho que
 * existe hoje; esta protege o caminho que alguém escrever amanhã. Um `.map`
 * novo sobre o Mapa de Prioridades, uma tela que cruze por conta própria, uma
 * refatoração que perca o filtro — todos caem aqui, com o nome do conceito na
 * mensagem. Defesa em profundidade é isso: a segunda barreira existe justamente
 * para o dia em que a primeira falhar.
 */
export function celulaDoMotor(
  subcriterionCode: string,
  importance: ImportanceLevel,
  status: SubcriterionStatus,
): CompatibilityResult {
  if (!participaDoMotor(subcriterionCode)) {
    throw new ConceitoForaDoMotorError(subcriterionCode);
  }
  return crossOne(importance, status);
}

/**
 * Cruza o Mapa do Case com o Mapa de um profissional.
 *
 * Só entram os subcritérios que o Case declarou: sem importância não existe
 * pergunta a fazer. Os que o Case ainda não declarou saem contados à parte —
 * o Curador precisa saber que o próprio Mapa dele está incompleto, e isso
 * não pode virar "compatibilidade" de espécie nenhuma.
 *
 * E só entram os que PARTICIPAM do Motor: os quatro `NUNCA` ficam de fora por
 * decisão de Método, não por acaso de dado (Item 1.1 · DP-1).
 *
 * Determinístico: mesma entrada, mesma saída, sempre. Nada de data, aleatório
 * ou ordem de chegada.
 */
export function crossPriorityAndProfessional(input: {
  /** O que o Case declarou — a fonte da lista de subcritérios cruzados. */
  casePriorities: readonly { subcriterionCode: string; importance: ImportanceLevel }[];
  professionalStates: readonly { subcriterionCode: string; status: SubcriterionStatus }[];
  /** Todos os subcritérios ativos, para saber o que o Case ainda não declarou. */
  activeSubcriterionCodes: readonly string[];
}): CompatibilityReading {
  const estadoPorCodigo = new Map(
    input.professionalStates.map((entry) => [entry.subcriterionCode, entry.status]),
  );
  const importanciaPorCodigo = new Map(
    input.casePriorities.map((entry) => [entry.subcriterionCode, entry.importance]),
  );

  // ITEM 1.1 — GUARDA DE ENTRADA (primeiro nível).
  //
  // Os conceitos `MOTOR_PARTICIPATION = NUNCA` saem do universo AQUI, antes de
  // qualquer leitura. Não é filtro de linha depois de montada: eles não chegam
  // a existir para o cruzamento — nem como linha, nem no resumo, nem entre os
  // "ainda não declarados", porque não estão pendentes de declaração nenhuma.
  //
  // Nada é apagado: o dado segue no banco e nas superfícies que o mostram. O
  // que muda é quem pode usá-lo (DP-1).
  const universo = apenasConceitosDoMotor(input.activeSubcriterionCodes);

  // A ordem é a do catálogo ativo — nunca a de inserção, que faria a mesma
  // leitura sair diferente conforme a ordem de gravação.
  const rows: CompatibilityRow[] = universo
    .filter((code) => importanciaPorCodigo.has(code))
    .map((code) => {
      const importance = importanciaPorCodigo.get(code)!;
      const status = estadoPorCodigo.get(code) ?? null;
      return {
        subcriterionCode: code,
        importance,
        status,
        // Sem declaração do profissional, a pergunta segue sem resposta — o
        // mesmo lugar de `NAO_INFORMADO`, e por isso a matriz o recebe.
        result: celulaDoMotor(code, importance, status ?? "NAO_INFORMADO"),
      };
    });

  const contar = (resultado: CompatibilityResult) =>
    rows.filter((row) => row.result === resultado).length;

  return {
    rows,
    summary: {
      totalSubcriteria: rows.length,
      highCompatibility: contar("ALTA_COMPATIBILIDADE"),
      mediumCompatibility: contar("MEDIA_COMPATIBILIDADE"),
      informationGaps: contar("LACUNA_DE_INFORMACAO"),
      notRelevant: contar("NAO_RELEVANTE"),
      gapsWithoutAnyRecord: rows.filter(
        (row) => row.result === "LACUNA_DE_INFORMACAO" && row.status === null,
      ).length,
      notDeclaredByCase: universo.filter((code) => !importanciaPorCodigo.has(code)).length,
    },
  };
}

/**
 * A leitura em uma frase. Conta, e só — nenhuma porcentagem, nenhuma nota,
 * nenhum adjetivo sobre o profissional.
 */
export function summarySentence(summary: CompatibilitySummary): string {
  if (summary.totalSubcriteria === 0) {
    return "O Mapa de Prioridades deste Case ainda não foi preenchido — não há o que cruzar.";
  }

  const partes = [
    `${summary.highCompatibility} de alta`,
    `${summary.mediumCompatibility} de média`,
    `${summary.informationGaps} com lacuna`,
    `${summary.notRelevant} não relevante${summary.notRelevant === 1 ? "" : "s"}`,
  ];

  return `${summary.totalSubcriteria} subcritério${summary.totalSubcriteria === 1 ? "" : "s"} cruzado${
    summary.totalSubcriteria === 1 ? "" : "s"
  }: ${partes.join(", ")}.`;
}

/**
 * Recusa comparar mapas de catálogos diferentes.
 *
 * O cruzamento inteiro depende de os dois lados apontarem para o mesmo
 * subcritério. Um código que existe de um lado e não do outro significa
 * catálogos divergentes — e comparar assim produziria uma leitura que parece
 * válida e não é.
 */
export function assertSameCatalog(
  codes: readonly string[],
  activeSubcriterionCodes: readonly string[],
  origem: string,
): void {
  const conhecidos = new Set(activeSubcriterionCodes);
  const estranhos = codes.filter((code) => !conhecidos.has(code));
  if (estranhos.length > 0) {
    throw new Error(
      `${origem} referencia subcritério fora do catálogo ativo: ${estranhos.join(", ")}. ` +
        "Os dois lados precisam falar do mesmo catálogo — comparar assim produziria leitura falsa.",
    );
  }
}
