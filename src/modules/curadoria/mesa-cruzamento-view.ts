/**
 * MESA DO CRUZAMENTO — a visão, sem banco
 *
 * Tudo aqui é função pura sobre dados já carregados. A separação tem dois
 * motivos: o cliente pode pré-visualizar o saldo de pontos sem uma ida ao
 * servidor, e cada regra da Mesa pode ser testada sem Supabase.
 *
 * O que este módulo NUNCA faz: decidir. Ele soma, classifica, explica e
 * ordena a leitura. Compatibilidade de área, avaliação de critério e seleção
 * são do Curador — o módulo só recusa apresentar como concluído o que ainda
 * não foi.
 */

import {
  BLOCK_POINTS,
  CRITERION_LABELS,
  PATIENT_CRITERIA,
  TECHNICAL_CRITERIA,
  applyAreaGate,
  cruzar,
  organizeForCurator,
  type AreaCompatibility,
  type Assessment,
  type CriterionEvaluation,
  type CriterionWeight,
  type CruzamentoCriterion,
  type CruzamentoResult,
} from "./cruzamento";

// ---------------------------------------------------------------------------
// Orçamento de pontos — o Curador nunca soma
// ---------------------------------------------------------------------------

export type BudgetView = {
  block: "TECNICO" | "PRIORIDADES";
  used: number;
  remaining: number;
  limit: number;
  complete: boolean;
  /** A frase que a tela mostra — "Restam 10 pontos" / "50 de 50 — distribuição concluída". */
  sentence: string;
};

export function budgetOf(
  weights: Partial<Record<CruzamentoCriterion, number>>,
  block: "TECNICO" | "PRIORIDADES",
): BudgetView {
  const criteria = block === "TECNICO" ? TECHNICAL_CRITERIA : PATIENT_CRITERIA;
  const used = criteria.reduce((total, criterion) => total + (weights[criterion] ?? 0), 0);
  const remaining = BLOCK_POINTS - used;
  const complete = remaining === 0;

  return {
    block,
    used,
    remaining,
    limit: BLOCK_POINTS,
    complete,
    sentence: complete
      ? `${BLOCK_POINTS} de ${BLOCK_POINTS} — distribuição concluída`
      : remaining > 0
        ? `${used} de ${BLOCK_POINTS} distribuídos. Restam ${remaining} ponto${remaining === 1 ? "" : "s"}.`
        : `A soma passou de ${BLOCK_POINTS}. Retire ${-remaining} ponto${remaining === -1 ? "" : "s"}.`,
  };
}

/**
 * O próximo valor de um critério, respeitando o saldo do bloco. Nunca
 * negativo, nunca acima do que resta — o excesso é recusado aqui, antes de
 * qualquer persistência.
 */
export function clampWeight(
  weights: Partial<Record<CruzamentoCriterion, number>>,
  criterion: CruzamentoCriterion,
  proposed: number,
): number {
  const block = (TECHNICAL_CRITERIA as readonly string[]).includes(criterion) ? "TECNICO" : "PRIORIDADES";
  const others = budgetOf(weights, block).used - (weights[criterion] ?? 0);
  return Math.max(0, Math.min(proposed, BLOCK_POINTS - others));
}

// ---------------------------------------------------------------------------
// Elegibilidade — os quatro estados de leitura
// ---------------------------------------------------------------------------

export type EligibilityState =
  | "AGUARDANDO_DECLARACAO"
  | "ELEGIVEL"
  | "ELIMINADO"
  | "PENDENTE_DE_INFORMACAO";

export const ELIGIBILITY_LABELS: Record<EligibilityState, string> = {
  AGUARDANDO_DECLARACAO: "Aguardando declaração",
  ELEGIVEL: "Elegível",
  ELIMINADO: "Eliminado pela área",
  PENDENTE_DE_INFORMACAO: "Pendente de verificação",
};

export type MandatoryFilterCheck = {
  label: string;
  requirement: string;
  professionalValue: string;
  /** null = informação não localizada; nunca vira "não atende". */
  passes: boolean | null;
};

export type ProfessionalEligibility = {
  professionalProfileId: string;
  state: EligibilityState;
  /** Por que está neste estado, em uma frase. */
  reason: string;
  filters: MandatoryFilterCheck[];
};

export type AreaDeclarationView = {
  compatibility: AreaCompatibility;
  confirmedByCurator: boolean;
  rationale: string | null;
} | null;

/**
 * Classifica um profissional na leitura da Mesa. A ordem das perguntas
 * importa: área primeiro (é a porta), filtros depois — um profissional
 * eliminado pela área nunca chega a ter filtros avaliados.
 */
export function classifyProfessional(
  professionalProfileId: string,
  declaration: AreaDeclarationView,
  filters: MandatoryFilterCheck[],
): ProfessionalEligibility {
  if (!declaration) {
    return {
      professionalProfileId,
      state: "AGUARDANDO_DECLARACAO",
      reason: "A compatibilidade de área ainda não foi declarada pelo Curador.",
      filters,
    };
  }

  const gate = applyAreaGate({
    professionalProfileId,
    compatibility: declaration.compatibility,
    rationale: declaration.rationale,
    confirmedByCurator: declaration.confirmedByCurator,
  });

  if (!gate.participates) {
    return {
      professionalProfileId,
      state: gate.pendingVerification ? "PENDENTE_DE_INFORMACAO" : "ELIMINADO",
      reason: gate.reason ?? "Não participa da comparação.",
      filters,
    };
  }

  const failing = filters.filter((filter) => filter.passes === false);
  if (failing.length > 0) {
    return {
      professionalProfileId,
      state: "ELIMINADO",
      reason: `Não atende: ${failing.map((filter) => filter.label).join(", ")}.`,
      filters,
    };
  }

  const unknown = filters.filter((filter) => filter.passes === null);
  if (unknown.length > 0) {
    return {
      professionalProfileId,
      state: "PENDENTE_DE_INFORMACAO",
      reason: `Sem informação registrada: ${unknown.map((filter) => filter.label).join(", ")}. Verificar o cadastro, não descartar.`,
      filters,
    };
  }

  return {
    professionalProfileId,
    state: "ELEGIVEL",
    reason: "Área declarada compatível e filtros obrigatórios atendidos.",
    filters,
  };
}

// ---------------------------------------------------------------------------
// Cabeçalho — os números que orientam o trabalho
// ---------------------------------------------------------------------------

export type HeaderCounts = {
  found: number;
  awaiting: number;
  eligible: number;
  eliminated: number;
  pending: number;
  selected: number;
};

export function headerCounts(eligibilities: ProfessionalEligibility[], selectedCount: number): HeaderCounts {
  const by = (state: EligibilityState) => eligibilities.filter((entry) => entry.state === state).length;
  return {
    found: eligibilities.length,
    awaiting: by("AGUARDANDO_DECLARACAO"),
    eligible: by("ELEGIVEL"),
    eliminated: by("ELIMINADO"),
    pending: by("PENDENTE_DE_INFORMACAO"),
    selected: selectedCount,
  };
}

/** De quem é a vez, dito em uma frase. */
export function nextStepSentence(counts: HeaderCounts, budgetsComplete: boolean, profileValidated: boolean): string {
  if (!profileValidated) return "O Perfil de Prioridades ainda precisa ser validado pela pessoa.";
  if (!budgetsComplete) return "Sua vez: distribuir os pontos dos dois blocos.";
  if (counts.awaiting > 0) return "Sua vez: declarar a compatibilidade de área dos profissionais pendentes.";
  if (counts.selected < 3) return "Sua vez: comparar as opções e selecionar três.";
  return "Seleção completa. Continue para o Relatório.";
}

// ---------------------------------------------------------------------------
// Comparação — células que explicam, nunca elegem
// ---------------------------------------------------------------------------

export type ComparisonCell = {
  criterion: CruzamentoCriterion;
  label: string;
  assessment: Assessment | null;
  /** "25/25", "5/10", ou "não avaliável". */
  pointsSentence: string;
  evidence: string;
};

export type ComparisonColumn = {
  professionalProfileId: string;
  result: CruzamentoResult;
  cells: ComparisonCell[];
  coverageSentence: string;
};

export function buildComparison(
  eligibleIds: string[],
  weights: CriterionWeight[],
  evaluationsByProfessional: Map<string, CriterionEvaluation[]>,
): ComparisonColumn[] {
  const technicalWeights = weights.filter((w) => (TECHNICAL_CRITERIA as readonly string[]).includes(w.criterion));
  const patientWeights = weights.filter((w) => (PATIENT_CRITERIA as readonly string[]).includes(w.criterion));

  const columns = eligibleIds.map((professionalProfileId) => {
    const result = cruzar({
      professionalProfileId,
      technicalWeights,
      patientWeights,
      evaluations: evaluationsByProfessional.get(professionalProfileId) ?? [],
    });

    const cells: ComparisonCell[] = [...result.technical.criteria, ...result.patient.criteria].map((entry) => ({
      criterion: entry.criterion,
      label: CRITERION_LABELS[entry.criterion],
      assessment: entry.assessment,
      pointsSentence:
        entry.alignment === null
          ? "não avaliável"
          : `${Math.round((entry.alignment / 100) * entry.weight)}/${entry.weight}`,
      evidence: entry.evidence,
    }));

    return {
      professionalProfileId,
      result,
      cells,
      coverageSentence: `Avaliação construída sobre ${result.coverage} dos 100 pontos possíveis.`,
    };
  });

  // Ordenação interna para facilitar a leitura — a seleção pertence ao
  // Curador. Sem número de posição, sem medalha, sem pré-marcação.
  return organizeForCurator(columns.map((column) => ({ ...column, total: column.result.total }))).map(
    (entry) => {
      const { total, ...column } = entry;
      void total;
      return column;
    },
  );
}
