/**
 * MESA DO CRUZAMENTO — a visão, sem banco
 *
 * Tudo aqui é função pura sobre dados já carregados, para que cada regra da
 * Mesa possa ser testada sem Supabase.
 *
 * O que este módulo NUNCA faz: decidir. Ele classifica e explica a leitura
 * que o Motor produziu. Compatibilidade de área, avaliação de critério e
 * seleção são do Curador — o módulo só recusa apresentar como concluído o
 * que ainda não foi.
 *
 * ADR-042: o saldo de pontos saiu daqui. Não há orçamento, não há soma, e a
 * matriz de compatibilidade não é reproduzida — vem pronta do Motor.
 */

import {
  applyAreaGate,
  type AreaCompatibility,
} from "./cruzamento";
import { SUBCRITERION_CATALOG, type ImportanceLevel, type Subcriterion } from "./mapa-prioridades";
import type { SubcriterionStatus } from "./mapa-profissional";
import type {
  CompatibilityReading,
  CompatibilityResult,
  CompatibilitySummary,
} from "./motor-compatibilidade";

// ---------------------------------------------------------------------------
// ADR-042 — o orçamento de pontos saiu daqui
// ---------------------------------------------------------------------------
//
// `BudgetView`, `budgetOf` e `clampWeight` foram removidos. Não existe mais
// orçamento a distribuir nem saldo a respeitar: o Case declara quanto cada
// subcritério importa, e nada precisa somar. A leitura de compatibilidade
// vem pronta do Motor (ADR-041) e não é recalculada aqui.

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
  // O RÓTULO NÃO NOMEIA A CAUSA — achado da travessia de 25/08.
  //
  // Ele dizia "Eliminado pela área", e essa era a única causa possível quando
  // foi escrito. Desde que o filtro obrigatório passou a eliminar (ADR-088), o
  // selo mente em parte dos casos: na travessia, uma profissional com a área
  // declarada COMPATÍVEL saiu pelo filtro de cuidado contínuo e apareceu como
  // "eliminado pela área" — com a frase logo abaixo dizendo a causa certa.
  //
  // Duas afirmações contrárias sobre o mesmo fato, na mesma ficha. O selo
  // passa a dizer só o ESTADO; a causa é da frase, que já a diz por inteiro e
  // sabe distinguir área de filtro, verificado de autodeclarado.
  ELIMINADO: "Eliminado",
  PENDENTE_DE_INFORMACAO: "Pendente de verificação",
};

/**
 * DE ONDE VEM O FATO que um filtro obrigatório confere — ADR-088.
 *
 * O filtro obrigatório elimina alguém da Curadoria. Eliminar é o ato mais
 * pesado da Mesa: a paciente nunca fica sabendo do caminho que não lhe foi
 * apresentado. Por isso a origem do fato importa tanto quanto o fato.
 *
 * - `VERIFICADO` — alguém conferiu contra fonte e registrou a proveniência.
 *   Só este elimina.
 * - `AUTODECLARADO` — o fato existe, dito pelo próprio profissional (cadastro
 *   ou Protocolo), sem conferência. Vira ressalva visível, nunca eliminação.
 * - `AUSENTE` — não há registro. Continua sendo "não se sabe".
 */
export type FilterFactOrigin = "VERIFICADO" | "AUTODECLARADO" | "AUSENTE";

export const FILTER_ORIGIN_LABELS: Record<FilterFactOrigin, string> = {
  VERIFICADO: "verificado com fonte",
  AUTODECLARADO: "declarado pelo profissional, sem verificação",
  AUSENTE: "sem registro",
};

export type MandatoryFilterCheck = {
  label: string;
  requirement: string;
  professionalValue: string;
  /** null = informação não localizada; nunca vira "não atende". */
  passes: boolean | null;
  /** De onde vem o fato. Só `VERIFICADO` elimina — ADR-088. */
  origin: FilterFactOrigin;
  /** Quando o fato foi registrado, para a tela dizer a idade dele. */
  factDate: string | null;
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

  // ADR-088 — só fato VERIFICADO elimina.
  //
  // O que existia antes: qualquer `passes === false` eliminava, viesse o fato
  // de onde viesse. Como o único fato disponível na prática é autodeclaração
  // do próprio profissional, a Mesa eliminava candidatos legítimos com base no
  // que eles mesmos disseram, em silêncio, e a paciente nunca ficava sabendo
  // do caminho suprimido. Parecia rigor e era acaso.
  //
  // Agora a eliminação por filtro exige fato conferido contra fonte. O fato
  // autodeclarado que contraria a exigência não some: vira ressalva nomeada,
  // no estado e na frase, e o Curador decide olhando o fato.
  const failing = filters.filter(
    (filter) => filter.passes === false && filter.origin === "VERIFICADO",
  );
  if (failing.length > 0) {
    return {
      professionalProfileId,
      state: "ELIMINADO",
      reason: `Não atende, com verificação: ${failing.map((filter) => filter.label).join(", ")}.`,
      filters,
    };
  }

  const ressalvas = filters.filter(
    (filter) => filter.passes === false && filter.origin === "AUTODECLARADO",
  );

  const unknown = filters.filter((filter) => filter.passes === null);
  if (unknown.length > 0) {
    return {
      professionalProfileId,
      state: "PENDENTE_DE_INFORMACAO",
      reason:
        `Sem informação registrada: ${unknown.map((filter) => filter.label).join(", ")}. Verificar o cadastro, não descartar.` +
        ressalvaSentence(ressalvas),
      filters,
    };
  }

  if (ressalvas.length > 0) {
    return {
      professionalProfileId,
      state: "ELEGIVEL",
      reason:
        `Elegível com ressalva — ${ressalvas.map((filter) => filter.label).join(", ")}: ` +
        "o próprio profissional declarou não atender, e ninguém conferiu. " +
        "Confirme com ele antes de compor, ou deixe de fora com a sua razão escrita.",
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

/** A ressalva dita ao fim de outra frase, sem virar frase solta. */
function ressalvaSentence(ressalvas: readonly MandatoryFilterCheck[]): string {
  if (ressalvas.length === 0) return "";
  return ` E há ressalva autodeclarada em: ${ressalvas.map((filter) => filter.label).join(", ")}.`;
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
export function nextStepSentence(
  counts: HeaderCounts,
  mapaCompleto: boolean,
  profileAcknowledged: boolean,
): string {
  if (!profileAcknowledged) return "A paciente ainda não reconheceu este Perfil como seu.";
  if (!mapaCompleto) return "Sua vez: classificar os subcritérios do Mapa de Prioridades.";
  if (counts.awaiting > 0) return "Sua vez: declarar a compatibilidade de área dos profissionais pendentes.";
  if (counts.selected < 3) return "Sua vez: comparar as opções e selecionar três.";
  return "Seleção completa. Continue para o Relatório.";
}

// ---------------------------------------------------------------------------
// Comparação — células que explicam, nunca elegem
// ---------------------------------------------------------------------------

/**
 * A frase de estado de um item. Existe para preservar, na tela, a distinção
 * que o Motor não faz: `SEM_REGISTRO` e `NAO_INFORMADO` caem os dois em
 * `LACUNA_DE_INFORMACAO`, mas um significa "ninguém olhou ainda" e o outro
 * "olharam e não havia". São conversas diferentes com o profissional.
 */
export function stateSentence(status: SubcriterionStatus | null): string {
  switch (status) {
    case "CONFIRMADO":
      return "Confirmado";
    case "NAO_CONFIRMADO":
      return "Não confirmado";
    case "NAO_INFORMADO":
      return "Analisado, mas sem informação suficiente";
    default:
      return "Ainda não investigado";
  }
}

export const COMPATIBILITY_CELL_LABELS: Record<CompatibilityResult, string> = {
  ALTA_COMPATIBILIDADE: "Alta compatibilidade",
  MEDIA_COMPATIBILIDADE: "Média compatibilidade",
  LACUNA_DE_INFORMACAO: "Lacuna de informação",
  NAO_RELEVANTE: "Não relevante",
};

export type ComparisonCell = {
  subcriterionCode: string;
  label: string;
  importance: ImportanceLevel;
  /** `null` = ausência de registro. Nunca colapsado em NAO_INFORMADO. */
  status: SubcriterionStatus | null;
  result: CompatibilityResult;
  /** "Ainda não investigado" / "Analisado, mas sem informação suficiente" / ... */
  stateSentence: string;
};

export type ComparisonColumn = {
  professionalProfileId: string;
  summary: CompatibilitySummary;
  cells: ComparisonCell[];
  /**
   * Contagens por estado, em texto. NÃO é score: são quantos itens caíram em
   * cada estado, e não existe soma geral que possa ser lida como nota.
   */
  resumo: string;
};

/**
 * Uma frase de contagem — nunca um total.
 *
 * "8 altas · 7 médias · 3 lacunas · 8 sem influência" diz o que foi
 * encontrado. Um número único diria quem ganhou, e isso o Método não faz.
 */
export function summarySentence(summary: CompatibilitySummary): string {
  const partes = [
    `${summary.highCompatibility} alta${summary.highCompatibility === 1 ? "" : "s"}`,
    `${summary.mediumCompatibility} média${summary.mediumCompatibility === 1 ? "" : "s"}`,
    `${summary.informationGaps} lacuna${summary.informationGaps === 1 ? "" : "s"} de informação`,
    `${summary.notRelevant} sem influência neste caso`,
  ];
  return partes.join(" · ");
}

/**
 * As colunas da comparação, montadas sobre a leitura que o Motor já produziu.
 *
 * A matriz de compatibilidade NÃO é reproduzida aqui: se a Mesa recalculasse,
 * existiriam duas verdades sobre o mesmo cruzamento.
 */
export function buildComparison(
  eligibleIds: readonly string[],
  readings: ReadonlyMap<string, CompatibilityReading>,
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): ComparisonColumn[] {
  const porCodigo = new Map(catalog.map((entry) => [entry.code, entry]));

  // Sem ordenação automática: ordenar profissionais exigiria uma chave, e
  // toda chave possível seria um ranking. As colunas seguem a ordem de
  // entrada — sem posição, sem medalha, sem pré-marcação.
  return eligibleIds.flatMap((professionalProfileId) => {
    const reading = readings.get(professionalProfileId);
    if (!reading) return [];

    const cells: ComparisonCell[] = reading.rows.map((row) => ({
      subcriterionCode: row.subcriterionCode,
      label: porCodigo.get(row.subcriterionCode)?.name ?? row.subcriterionCode,
      importance: row.importance,
      status: row.status,
      result: row.result,
      stateSentence: stateSentence(row.status),
    }));

    return [
      {
        professionalProfileId,
        summary: reading.summary,
        cells,
        resumo: summarySentence(reading.summary),
      },
    ];
  });
}
