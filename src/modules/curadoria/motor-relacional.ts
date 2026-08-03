/**
 * MOTOR DE COMPATIBILIDADE RELACIONAL — ADR-065.
 *
 * @metodo docs/curadoria/DOMINIO_COMPATIBILIDADE_RELACIONAL.md (Partes 4-5)
 * @metodo docs/curadoria/MODELO_CURADORIA_V1.md §7.2-R (Modelo v2.0)
 *
 * A quarta leitura da Curadoria: grau da PESSOA × estado derivado do
 * PROFISSIONAL, por identidade de opção (satisfied_by do Catálogo — nunca por
 * rótulo). Herda a física do Motor de Compatibilidade (ADR-041): os mesmos
 * quatro resultados, matriz fechada célula a célula, resumo que conta
 * ocorrências e nada mais.
 *
 * O que este motor NÃO faz, por definição: não escreve, não ordena, não
 * elimina, não soma, não compensa outra leitura. Conceitos de cruzamento
 * humano (`cruzamento: "humano"` no Catálogo) NUNCA produzem célula — emitem
 * a sinalização AGUARDA_JUIZO_DO_CURADOR, fora da escala de resultados.
 *
 * GRAU NUNCA É IMPORTÂNCIA (migration 20260801140000): este motor recusa em
 * runtime qualquer valor fora de NEED_DEGREES — a colisão de escalas que já
 * aconteceu uma vez não volta por porta nova.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { CATALOGO_GERADO, type CatalogoConceito } from "./catalogo-gerado";
import {
  type CompatibilityResult,
} from "./motor-compatibilidade";
import { NEED_DEGREES, type NeedDegree } from "./protocolos";

// ---------------------------------------------------------------------------
// O universo da leitura — derivado do eixo, nunca de lista paralela
// ---------------------------------------------------------------------------

export const RELATIONAL_AXIS = "MODELO_DE_ATENDIMENTO" as const;

/** Os conceitos da leitura relacional, na ordem canônica do Catálogo. */
export const RELATIONAL_CONCEPTS: readonly CatalogoConceito[] = CATALOGO_GERADO.filter(
  (entry) => entry.active && entry.axis === RELATIONAL_AXIS,
);

export const RELATIONAL_CONCEPTS_BY_CODE: ReadonlyMap<string, CatalogoConceito> = new Map(
  RELATIONAL_CONCEPTS.map((entry) => [entry.code, entry]),
);

export function isRelationalConceptCode(code: string): boolean {
  return RELATIONAL_CONCEPTS_BY_CODE.has(code);
}

// ---------------------------------------------------------------------------
// Estados e sinalizações
// ---------------------------------------------------------------------------

/** O estado derivado do profissional — os mesmos três do Mapa (ADR-040). */
export const RELATIONAL_STATES = ["CONFIRMADO", "NAO_CONFIRMADO", "NAO_INFORMADO"] as const;
export type RelationalState = (typeof RELATIONAL_STATES)[number];

/**
 * A sinalização dos conceitos humanos — FORA da escala de quatro resultados
 * (precedente: eixo Viabilidade e as sinalizações fora-da-matriz).
 */
export const AGUARDA_JUIZO_DO_CURADOR = "AGUARDA_JUIZO_DO_CURADOR" as const;

// ---------------------------------------------------------------------------
// A matriz — 4 graus × 3 estados, doze células escritas
// ---------------------------------------------------------------------------

/**
 * Princípios herdados do Motor assistencial (motor-compatibilidade.ts):
 *
 * P1 — "sem preferência" encerra o assunto: nada que o profissional tenha ou
 *      deixe de ter muda o cruzamento. NAO_RELEVANTE nos três estados.
 * P2 — ausência nunca elimina, e nunca vira alta: NAO_CONFIRMADO devolve
 *      MÉDIA em todo grau que conta.
 * P3 — lacuna aparece como lacuna: NAO_INFORMADO devolve LACUNA em todo grau
 *      que conta — quem escolhe ignorá-la é o Curador, olhando para ela.
 *
 * DESEJAVEL × CONFIRMADO é MÉDIA (espelha RELEVANTE/POUCO_IMPORTANTE da
 * matriz vigente): o desejável presente soma conforto, não estrutura.
 */
export const MATRIZ_RELACIONAL: Record<NeedDegree, Record<RelationalState, CompatibilityResult>> = {
  ESSENCIAL: {
    CONFIRMADO: "ALTA_COMPATIBILIDADE", //     definido (DOMINIO Parte 5.2)
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // P2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  P3
  },
  PESA_MUITO: {
    CONFIRMADO: "ALTA_COMPATIBILIDADE", //     definido
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // P2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  P3
  },
  DESEJAVEL: {
    CONFIRMADO: "MEDIA_COMPATIBILIDADE", //    espelho da matriz vigente
    NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE", // P2
    NAO_INFORMADO: "LACUNA_DE_INFORMACAO", //  P3, leitura conservadora
  },
  SEM_PREFERENCIA: {
    CONFIRMADO: "NAO_RELEVANTE", //            P1
    NAO_CONFIRMADO: "NAO_RELEVANTE", //        P1
    NAO_INFORMADO: "NAO_RELEVANTE", //         P1
  },
};

// ---------------------------------------------------------------------------
// Entradas mínimas — o motor não conhece banco, só declarações
// ---------------------------------------------------------------------------

/** O que a pessoa declarou para um conceito relacional (de case_needs). */
export type RelationalNeed = {
  subcriterionCode: string;
  /** Códigos de opção do lado da pessoa (Catálogo). */
  options: readonly string[];
  degree: NeedDegree;
  /** Texto guiado — só existe em MODELO_PREFERENCIAS_E_RESTRICOES (P14). */
  guidedText?: string | null;
};

/** A declaração vigente do profissional para um conceito (da Base). */
export type RelationalEvidence = {
  subcriterionCode: string;
  /** Condutas declaradas — códigos do lado profissional, campo principal. */
  options: readonly string[];
};

// ---------------------------------------------------------------------------
// Derivação do estado — §7.1 do documento normativo
// ---------------------------------------------------------------------------

/** O par que sustenta cada frase: a opção da pessoa e o que a satisfaz. */
export type RelationalOptionMatch = {
  personOption: string;
  personLabel: string;
  /**
   * Condutas declaradas que satisfazem a opção. `["*"]` colapsa para as
   * condutas declaradas (correspondência universal). Vazio = não satisfeita.
   */
  matchedConducts: readonly string[];
  satisfied: boolean;
};

function opcoesDaPessoaDoConceito(concept: CatalogoConceito): Map<string, { label: string; satisfiedBy: readonly string[] | null }> {
  const mapa = new Map<string, { label: string; satisfiedBy: readonly string[] | null }>();
  for (const campo of concept.paciente) {
    if (campo.field !== "principal") continue;
    for (const opcao of campo.options) {
      if (opcao.active) mapa.set(opcao.value, { label: opcao.label, satisfiedBy: opcao.satisfiedBy });
    }
  }
  return mapa;
}

/**
 * Deriva o estado do profissional para UM conceito automático:
 *   1. sem evidência vigente → NAO_INFORMADO;
 *   2. evidência vigente com alguma opção pedida sem conduta correspondente
 *      declarada → NAO_CONFIRMADO (em pergunta de múltipla escolha
 *      respondida, a conduta não marcada é fato declarado, não lacuna);
 *   3. toda opção pedida com correspondência → CONFIRMADO.
 * O detalhe opção-a-opção é preservado — o agregado nunca apaga o par.
 */
export function deriveRelationalState(
  concept: CatalogoConceito,
  personOptions: readonly string[],
  evidence: RelationalEvidence | null,
): { state: RelationalState; matches: RelationalOptionMatch[] } {
  const catalogoDaPessoa = opcoesDaPessoaDoConceito(concept);
  const pedidas = personOptions.filter((value) => {
    const opcao = catalogoDaPessoa.get(value);
    // Fora do mecanismo: opção desconhecida do Catálogo (a validação do
    // protocolo já a recusa na porta) ou sem correspondência declarada
    // (ex.: NAO_TENHO_PREFERENCIA) — não participa da derivação.
    return opcao !== undefined && opcao.satisfiedBy !== null;
  });

  if (!evidence) {
    return {
      state: "NAO_INFORMADO",
      matches: pedidas.map((value) => ({
        personOption: value,
        personLabel: catalogoDaPessoa.get(value)!.label,
        matchedConducts: [],
        satisfied: false,
      })),
    };
  }

  const declaradas = new Set(evidence.options);
  const matches: RelationalOptionMatch[] = pedidas.map((value) => {
    const { label, satisfiedBy } = catalogoDaPessoa.get(value)!;
    if (satisfiedBy!.includes("*")) {
      return {
        personOption: value,
        personLabel: label,
        matchedConducts: [...evidence.options],
        satisfied: true,
      };
    }
    const correspondentes = satisfiedBy!.filter((conduta) => declaradas.has(conduta));
    return {
      personOption: value,
      personLabel: label,
      matchedConducts: correspondentes,
      satisfied: correspondentes.length > 0,
    };
  });

  const state: RelationalState = matches.some((m) => !m.satisfied) ? "NAO_CONFIRMADO" : "CONFIRMADO";
  return { state, matches };
}

// ---------------------------------------------------------------------------
// O cruzamento — uma leitura por conceito
// ---------------------------------------------------------------------------

export type RelationalCellReading = {
  kind: "CELULA";
  code: string;
  conceptName: string;
  degree: NeedDegree;
  state: RelationalState;
  result: CompatibilityResult;
  matches: RelationalOptionMatch[];
  /** As condutas declaradas do profissional (vazio se NAO_INFORMADO). */
  declaredConducts: readonly string[];
};

export type RelationalHumanReading = {
  kind: "JUIZO_HUMANO";
  code: string;
  conceptName: string;
  signal: typeof AGUARDA_JUIZO_DO_CURADOR;
  degree: NeedDegree;
  personOptions: readonly string[];
  /** Texto guiado da pessoa (P14) — vai ao Curador na íntegra, nunca a motor. */
  personGuidedText: string | null;
  declaredConducts: readonly string[];
  /** A lacuna não some por ser conceito humano. */
  hasEvidence: boolean;
};

export type RelationalReading = RelationalCellReading | RelationalHumanReading;

function assertNeedDegree(value: string, code: string): asserts value is NeedDegree {
  if (!NEED_DEGREES.includes(value as NeedDegree)) {
    throw new Error(
      `Grau inválido em ${code}: "${value}". Grau da pessoa nunca é importância do Case — ` +
        `as escalas não têm valor em comum (migration 20260801140000). Válidos: ${NEED_DEGREES.join(", ")}.`,
    );
  }
}

/**
 * Cruza UM conceito relacional. Devolve `null` quando a pessoa não respondeu
 * o conceito — fora do cruzamento (análogo de notDeclaredByCase), nunca
 * inferido.
 */
export function crossRelationalConcept(
  concept: CatalogoConceito,
  need: RelationalNeed | null,
  evidence: RelationalEvidence | null,
): RelationalReading | null {
  if (concept.axis !== RELATIONAL_AXIS || !concept.active) {
    throw new Error(`${concept.code} não pertence à leitura relacional.`);
  }
  if (!need) return null;
  assertNeedDegree(need.degree, concept.code);

  if (concept.cruzamento === "humano") {
    return {
      kind: "JUIZO_HUMANO",
      code: concept.code,
      conceptName: concept.name,
      signal: AGUARDA_JUIZO_DO_CURADOR,
      degree: need.degree,
      personOptions: [...need.options],
      personGuidedText: need.guidedText ?? null,
      declaredConducts: evidence ? [...evidence.options] : [],
      hasEvidence: evidence !== null,
    };
  }

  const { state, matches } = deriveRelationalState(concept, need.options, evidence);
  return {
    kind: "CELULA",
    code: concept.code,
    conceptName: concept.name,
    degree: need.degree,
    state,
    result: MATRIZ_RELACIONAL[need.degree][state],
    matches,
    declaredConducts: evidence ? [...evidence.options] : [],
  };
}

/** O cruzamento completo de um par (Case, profissional), na ordem do Catálogo. */
export function crossRelational(
  needs: readonly RelationalNeed[],
  evidenceByCode: ReadonlyMap<string, RelationalEvidence>,
): { readings: RelationalReading[]; notAnsweredByPerson: string[] } {
  const porCodigo = new Map(needs.map((need) => [need.subcriterionCode, need]));
  const readings: RelationalReading[] = [];
  const notAnsweredByPerson: string[] = [];

  for (const concept of RELATIONAL_CONCEPTS) {
    const need = porCodigo.get(concept.code) ?? null;
    const reading = crossRelationalConcept(concept, need, evidenceByCode.get(concept.code) ?? null);
    if (reading === null) {
      notAnsweredByPerson.push(concept.code);
      continue;
    }
    readings.push(reading);
  }

  return { readings, notAnsweredByPerson };
}

// ---------------------------------------------------------------------------
// Resumo — conta ocorrências e nada mais (ADR-041, herdado)
// ---------------------------------------------------------------------------

export type RelationalSummary = {
  altas: number;
  medias: number;
  lacunas: number;
  naoRelevantes: number;
  aguardamJuizo: number;
};

export function relationalSummary(readings: readonly RelationalReading[]): RelationalSummary {
  const summary: RelationalSummary = { altas: 0, medias: 0, lacunas: 0, naoRelevantes: 0, aguardamJuizo: 0 };
  for (const reading of readings) {
    if (reading.kind === "JUIZO_HUMANO") {
      summary.aguardamJuizo += 1;
      continue;
    }
    if (reading.result === "ALTA_COMPATIBILIDADE") summary.altas += 1;
    else if (reading.result === "MEDIA_COMPATIBILIDADE") summary.medias += 1;
    else if (reading.result === "LACUNA_DE_INFORMACAO") summary.lacunas += 1;
    else summary.naoRelevantes += 1;
  }
  return summary;
}

/** A frase do cabeçalho — contagem, nunca soma, nunca ordenação. */
export function relationalSummarySentence(summary: RelationalSummary): string {
  const partes: string[] = [];
  if (summary.altas > 0) partes.push(`${summary.altas} ${summary.altas === 1 ? "alta" : "altas"}`);
  if (summary.medias > 0) partes.push(`${summary.medias} ${summary.medias === 1 ? "média" : "médias"}`);
  if (summary.lacunas > 0)
    partes.push(`${summary.lacunas} ${summary.lacunas === 1 ? "lacuna" : "lacunas"} de informação`);
  if (summary.naoRelevantes > 0) partes.push(`${summary.naoRelevantes} sem influência`);
  if (summary.aguardamJuizo > 0)
    partes.push(
      `${summary.aguardamJuizo} ${summary.aguardamJuizo === 1 ? "aguarda" : "aguardam"} juízo do Curador`,
    );
  return partes.length > 0 ? partes.join(" · ") : "Sem leitura relacional a exibir.";
}
