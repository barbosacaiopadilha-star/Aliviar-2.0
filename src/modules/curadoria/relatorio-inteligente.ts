/**
 * RELATÓRIO INTELIGENTE — composição determinística e rastreável.
 *
 * O sistema não cria conclusões. Ele transforma conclusões já registradas —
 * declarações do Curador, avaliações de critério, evidências, coberturas,
 * divergências — em texto organizado. Cada frase carrega a própria origem, e
 * frase que não consegue dizer de onde veio não é gerada.
 *
 * Determinístico por construção: mesma entrada, mesma saída, ordem estável,
 * sem aleatoriedade, sem chamadas externas, sem IA generativa, sem inferência
 * semântica. O melhor resultado possível é um rascunho — quem aprova, assume
 * autoria e emite é o Curador (ADR-035; Modelo v1.0 §8.3).
 *
 * Módulo puro: não conhece banco nem interface. A montagem da entrada tipada
 * vive em relatorio-assistido.ts (server-only).
 */

import {
  BLOCK_POINTS,
  CRITERION_LABELS,
  coverageSentence,
  type Assessment,
  type CruzamentoCriterion,
  type CruzamentoResult,
} from "./cruzamento";
import type { AreaCompatibility } from "./cruzamento";

/** Versão do gerador — gravada em cada rascunho para auditoria. */
export const GENERATOR_VERSION = "relatorio-inteligente/1.0.0";

// ---------------------------------------------------------------------------
// Rastreabilidade
// ---------------------------------------------------------------------------

export type ProvenanceRef = {
  sourceType:
    | "declaracao_de_area"
    | "avaliacao_de_criterio"
    | "cobertura"
    | "divergencia"
    | "lacuna";
  criterion?: CruzamentoCriterion;
  /** Autor da declaração humana, quando houver. */
  author?: string | null;
  declaredAt?: string | null;
};

export type TracedSentence = {
  text: string;
  provenance: ProvenanceRef[];
};

export type DraftField = {
  sentences: TracedSentence[];
  /** As frases unidas, para a tela editar como um campo só. */
  text: string;
  /** Verdadeiro quando os dados não bastam e o Curador precisa escrever. */
  requiresCurator: boolean;
};

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export type AreaDeclarationRef = {
  compatibility: AreaCompatibility;
  rationale: string | null;
  declaredBy: string;
  declaredAt: string;
};

export type OptionDraftInput = {
  professionalProfileId: string;
  /** Resultado do motor — Avaliação Técnica e Compatibilidade Assistencial. */
  result: CruzamentoResult;
  /** A declaração de área que deixou esta opção participar. */
  areaDeclaration: AreaDeclarationRef | null;
  /** Autoria das declarações de critério, por critério. */
  declarationAuthors?: Partial<Record<CruzamentoCriterion, { declaredBy: string; declaredAt: string }>>;
  openCriticalDivergences: number;
};

export type DraftInput = {
  /** A área que o Case exige — para a justificativa dizer contra o quê. */
  areaRequirement: string | null;
  /** Exatamente três, distintas, todas participantes. O gerador recusa o resto. */
  options: OptionDraftInput[];
};

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

export type OptionDraft = {
  professionalProfileId: string;
  justificativa: DraftField;
  relacaoTecnica: DraftField;
  relacaoPrioridades: DraftField;
  pontosDeAtencao: { items: TracedSentence[]; requiresCurator: boolean };
  pontosFavoraveis: TracedSentence[];
  perguntasSugeridas: TracedSentence[];
  /** Sempre vazio ao nascer. O sistema jamais escreve pelo Curador. */
  observacoesDoCurador: "";
  /** O que os dados não permitiram concluir — visível, nunca escondido. */
  lacunas: string[];
};

export type ReportDraft = {
  generatorVersion: string;
  options: OptionDraft[];
};

// ---------------------------------------------------------------------------
// Frases por critério — a matéria-prima de tudo
// ---------------------------------------------------------------------------

const TECHNICAL_ORDER: readonly CruzamentoCriterion[] = ["FORMACAO", "EXPERIENCIA", "HISTORICO"];
const PATIENT_ORDER: readonly CruzamentoCriterion[] = [
  "ACESSO",
  "CONTINUIDADE_DO_CUIDADO",
  "MODELO_DE_ATENDIMENTO",
];

type OutcomeRef = CruzamentoResult["technical"]["criteria"][number];

function outcomeOf(input: OptionDraftInput, criterion: CruzamentoCriterion): OutcomeRef {
  const all = [...input.result.technical.criteria, ...input.result.patient.criteria];
  return all.find((entry) => entry.criterion === criterion)!;
}

function provenanceOf(input: OptionDraftInput, outcome: OutcomeRef): ProvenanceRef {
  const author = input.declarationAuthors?.[outcome.criterion];
  return {
    sourceType: outcome.alignment === null ? "lacuna" : "avaliacao_de_criterio",
    criterion: outcome.criterion,
    author: author?.declaredBy ?? null,
    declaredAt: author?.declaredAt ?? null,
  };
}

/**
 * Uma frase por avaliação, sempre na mesma forma. O adjetivo nunca aparece:
 * "atende plenamente" é o que o Curador declarou; "excelente" seria o que
 * ninguém declarou.
 */
function sentenceFor(input: OptionDraftInput, outcome: OutcomeRef): TracedSentence {
  const label = CRITERION_LABELS[outcome.criterion];
  const provenance = [provenanceOf(input, outcome)];

  switch (outcome.assessment satisfies Assessment) {
    case "ATENDE_PLENAMENTE":
      return { text: `${label} atende plenamente ao que este caso exige. ${outcome.evidence}`, provenance };
    case "ATENDE_PARCIALMENTE":
      return { text: `${label} atende parcialmente ao que este caso exige. ${outcome.evidence}`, provenance };
    case "NAO_ATENDE":
      return { text: `${label} não atende ao que este caso exige. ${outcome.evidence}`, provenance };
    case "INFORMACAO_INSUFICIENTE":
      return {
        text: `${label} não pôde ser avaliada porque não havia informação suficiente. ${outcome.evidence}`,
        provenance,
      };
  }
}

// ---------------------------------------------------------------------------
// Campos
// ---------------------------------------------------------------------------

function field(sentences: TracedSentence[], requiresCurator = false): DraftField {
  return { sentences, text: sentences.map((s) => s.text).join(" "), requiresCurator };
}

/**
 * Por que esta opção está no Relatório. Construída de duas âncoras reais: a
 * melhor aderência técnica declarada e a melhor aderência assistencial — pelo
 * peso, para falar primeiro do que mais importa a esta pessoa.
 */
function buildJustificativa(input: OptionDraftInput, areaRequirement: string | null): DraftField {
  const sentences: TracedSentence[] = [];

  if (input.areaDeclaration) {
    const area = input.areaDeclaration;
    const base =
      area.compatibility === "PARCIALMENTE_COMPATIVEL"
        ? "A área de atuação foi declarada parcialmente compatível e confirmada pelo Curador"
        : "A área de atuação foi declarada compatível pelo Curador";
    sentences.push({
      text: `${base}${areaRequirement ? ` com o que o caso exige (${areaRequirement})` : ""}.`,
      provenance: [
        {
          sourceType: "declaracao_de_area",
          author: area.declaredBy,
          declaredAt: area.declaredAt,
        },
      ],
    });
  }

  const bestOf = (order: readonly CruzamentoCriterion[]) => {
    const outcomes = order
      .map((criterion) => outcomeOf(input, criterion))
      .filter((entry) => entry.assessment === "ATENDE_PLENAMENTE" || entry.assessment === "ATENDE_PARCIALMENTE")
      .sort((a, b) => b.weight - a.weight || order.indexOf(a.criterion) - order.indexOf(b.criterion));
    return outcomes[0] ?? null;
  };

  const tecnico = bestOf(TECHNICAL_ORDER);
  const assistencial = bestOf(PATIENT_ORDER);

  if (tecnico && assistencial) {
    const grau = (o: OutcomeRef) => (o.assessment === "ATENDE_PLENAMENTE" ? "aderência" : "aderência parcial");
    sentences.push({
      text: `Esta opção foi incluída por apresentar ${grau(tecnico)} ao caso em ${CRITERION_LABELS[tecnico.criterion]} e por responder, em ${CRITERION_LABELS[assistencial.criterion]}, ao que a pessoa declarou como prioridade.`,
      provenance: [provenanceOf(input, tecnico), provenanceOf(input, assistencial)],
    });
  }

  // Sem nenhuma aderência declarada não há justificativa honesta possível — e
  // inventá-la é exatamente o que este gerador existe para não fazer.
  return field(sentences, tecnico === null || assistencial === null);
}

function buildRelacao(
  input: OptionDraftInput,
  order: readonly CruzamentoCriterion[],
  block: CruzamentoResult["technical"],
  opening: string,
): DraftField {
  const sentences: TracedSentence[] = order.map((criterion) => sentenceFor(input, outcomeOf(input, criterion)));

  if (sentences.length > 0) {
    sentences[0] = { ...sentences[0]!, text: `${opening} ${sentences[0]!.text}` };
  }

  if (block.coveredWeight < BLOCK_POINTS) {
    sentences.push({
      text: coverageSentence(block),
      provenance: [{ sourceType: "cobertura" }],
    });
  }

  return field(sentences);
}

/**
 * Pontos de atenção — obrigatórios, e nunca inventados. Se os dados não
 * produzirem nenhum, o campo fica pendente do Curador: "nenhum ponto de
 * atenção identificado" é uma frase que este gerador se recusa a escrever,
 * porque opção só com virtudes é recomendação.
 */
function buildAtencao(input: OptionDraftInput): { items: TracedSentence[]; requiresCurator: boolean } {
  const items: TracedSentence[] = [];

  for (const criterion of [...TECHNICAL_ORDER, ...PATIENT_ORDER]) {
    const outcome = outcomeOf(input, criterion);
    if (outcome.assessment === "ATENDE_PARCIALMENTE" || outcome.assessment === "NAO_ATENDE") {
      items.push(sentenceFor(input, outcome));
    }
    if (outcome.assessment === "INFORMACAO_INSUFICIENTE") {
      items.push({
        text: `Parte de ${CRITERION_LABELS[outcome.criterion]} não pôde ser avaliada por falta de informação — a lacuna deve ser considerada na conversa.`,
        provenance: [{ sourceType: "lacuna", criterion: outcome.criterion }],
      });
    }
  }

  if (input.areaDeclaration?.compatibility === "PARCIALMENTE_COMPATIVEL" && input.areaDeclaration.rationale) {
    items.push({
      text: `Sobre a área de atuação: ${input.areaDeclaration.rationale}`,
      provenance: [
        {
          sourceType: "declaracao_de_area",
          author: input.areaDeclaration.declaredBy,
          declaredAt: input.areaDeclaration.declaredAt,
        },
      ],
    });
  }

  if (input.openCriticalDivergences > 0) {
    items.push({
      text: `Há ${input.openCriticalDivergences} divergência(s) em aberto entre fontes no cadastro deste profissional — as duas versões estão registradas e aguardam resolução.`,
      provenance: [{ sourceType: "divergencia" }],
    });
  }

  return { items, requiresCurator: items.length === 0 };
}

/** Aderências plenas que a justificativa não citou — sem repeti-la inteira. */
function buildFavoraveis(input: OptionDraftInput, justificativa: DraftField): TracedSentence[] {
  const cited = new Set(
    justificativa.sentences.flatMap((sentence) => sentence.provenance.map((ref) => ref.criterion)),
  );

  return [...TECHNICAL_ORDER, ...PATIENT_ORDER]
    .map((criterion) => outcomeOf(input, criterion))
    .filter((outcome) => outcome.assessment === "ATENDE_PLENAMENTE" && !cited.has(outcome.criterion))
    .map((outcome) => sentenceFor(input, outcome));
}

/**
 * Perguntas determinísticas, cada uma amarrada a uma lacuna ou ponto de
 * atenção real deste dossiê. Pergunta genérica não nasce aqui.
 */
function buildPerguntas(input: OptionDraftInput): TracedSentence[] {
  const perguntas: TracedSentence[] = [];
  const ask = (criterion: CruzamentoCriterion, text: string, sourceType: ProvenanceRef["sourceType"]) =>
    perguntas.push({ text, provenance: [{ sourceType, criterion }] });

  const continuidade = outcomeOf(input, "CONTINUIDADE_DO_CUIDADO");
  if (continuidade.assessment === "ATENDE_PARCIALMENTE" || continuidade.assessment === "INFORMACAO_INSUFICIENTE") {
    ask(
      "CONTINUIDADE_DO_CUIDADO",
      "Como funciona o acompanhamento após a primeira consulta?",
      continuidade.assessment === "INFORMACAO_INSUFICIENTE" ? "lacuna" : "avaliacao_de_criterio",
    );
  }

  const modelo = outcomeOf(input, "MODELO_DE_ATENDIMENTO");
  if (modelo.assessment === "INFORMACAO_INSUFICIENTE") {
    ask("MODELO_DE_ATENDIMENTO", "Há possibilidade de participação de um familiar nas consultas e decisões?", "lacuna");
  }

  const acesso = outcomeOf(input, "ACESSO");
  if (acesso.assessment === "ATENDE_PARCIALMENTE" || acesso.assessment === "INFORMACAO_INSUFICIENTE") {
    ask(
      "ACESSO",
      "Quais etapas do acompanhamento precisam ocorrer presencialmente?",
      acesso.assessment === "INFORMACAO_INSUFICIENTE" ? "lacuna" : "avaliacao_de_criterio",
    );
  }

  return perguntas;
}

function buildLacunas(input: OptionDraftInput): string[] {
  const lacunas: string[] = [];
  for (const criterion of [...TECHNICAL_ORDER, ...PATIENT_ORDER]) {
    const outcome = outcomeOf(input, criterion);
    if (outcome.assessment === "INFORMACAO_INSUFICIENTE") {
      lacunas.push(CRITERION_LABELS[criterion]);
    }
  }
  return lacunas;
}

// ---------------------------------------------------------------------------
// O gerador
// ---------------------------------------------------------------------------

export function generateReportDraft(input: DraftInput): ReportDraft {
  if (input.options.length !== 3) {
    throw new Error(
      `O Relatório apresenta sempre exatamente três opções — o rascunho recebeu ${input.options.length}.`,
    );
  }
  const distinct = new Set(input.options.map((option) => option.professionalProfileId));
  if (distinct.size !== 3) {
    throw new Error("As três opções do Relatório precisam ser distintas.");
  }

  const options = input.options.map((option) => {
    const justificativa = buildJustificativa(option, input.areaRequirement);

    return {
      professionalProfileId: option.professionalProfileId,
      justificativa,
      relacaoTecnica: buildRelacao(option, TECHNICAL_ORDER, option.result.technical, "Na Avaliação Técnica:"),
      relacaoPrioridades: buildRelacao(
        option,
        PATIENT_ORDER,
        option.result.patient,
        "Em relação ao Perfil de Prioridades validado:",
      ),
      pontosDeAtencao: buildAtencao(option),
      pontosFavoraveis: buildFavoraveis(option, justificativa),
      perguntasSugeridas: buildPerguntas(option),
      observacoesDoCurador: "" as const,
      lacunas: buildLacunas(option),
    };
  });

  return { generatorVersion: GENERATOR_VERSION, options };
}
