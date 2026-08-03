/**
 * RELATÓRIO INTELIGENTE — composição determinística e rastreável.
 *
 * O sistema não cria conclusões. Ele transforma conclusões já registradas —
 * o Mapa de Prioridades do Case, o Mapa do Profissional, as declarações do
 * Curador — em texto organizado. Cada frase carrega a própria origem, e frase
 * que não consegue dizer de onde veio não é gerada.
 *
 * Determinístico por construção: mesma entrada, mesma saída, ordem estável,
 * sem aleatoriedade, sem chamadas externas, sem IA generativa, sem inferência
 * semântica. O melhor resultado possível é um rascunho — quem aprova, assume
 * autoria e emite é o Curador (ADR-035; Modelo v1.0 §8.3).
 *
 * O QUE MUDOU — ADR-042. O eixo do Relatório eram os seis critérios do
 * Cruzamento, cada um com um peso, e a cobertura era dita em pontos ("35 de
 * 50"). O peso ordenava as frases: falava-se primeiro do que tinha mais
 * pontos. Agora o eixo são os subcritérios do catálogo canônico, a ordem vem
 * do nível de importância que o Case declarou, e a completude é a do Mapa.
 *
 * Nenhum ponto sobrevive aqui — nem como número, nem como ordenação, nem como
 * frase de cobertura.
 *
 * Módulo puro: não conhece banco nem interface. A montagem da entrada tipada
 * vive em relatorio-assistido.ts (server-only).
 */

import type { AreaCompatibility } from "./cruzamento";
import {
  SUBCRITERION_CATALOG,
  SUBCRITERION_GROUPS,
  importanceOrdinal,
  priorityMapCompletion,
  type ImportanceLevel,
  type PriorityMapCompletion,
  type Subcriterion,
} from "./mapa-prioridades";
import type { SubcriterionStatus } from "./mapa-profissional";
import { crossOne, type CompatibilityResult } from "./motor-compatibilidade";
import {
  RELATIONAL_CONCEPTS,
  relationalConductLabel,
  relationalPersonOptionLabel,
  type RelationalReading,
} from "./motor-relacional";
import type { NeedDegree } from "./protocolos";

/** Versão do gerador — gravada em cada rascunho para auditoria. */
// 2.1.0: seção da leitura relacional (ADR-065) — nova origem de conclusão.
export const GENERATOR_VERSION = "relatorio-inteligente/2.1.0";

// ---------------------------------------------------------------------------
// Rastreabilidade
// ---------------------------------------------------------------------------

export type ProvenanceRef = {
  sourceType:
    | "declaracao_de_area"
    | "mapa_de_prioridades"
    | "mapa_do_profissional"
    | "completude_do_mapa"
    | "divergencia"
    | "lacuna"
    // ADR-065: frase da leitura relacional — o par (opção da pessoa ×
    // conduta declarada) que a sustenta vai nos campos abaixo.
    | "leitura_relacional";
  /** O subcritério do catálogo canônico a que a frase se refere. */
  subcriterion?: string;
  /** O nível declarado pelo Case — a origem da ordem e do destaque. */
  importance?: ImportanceLevel;
  /** O estado factual declarado sobre o profissional. `null` = sem registro. */
  status?: SubcriterionStatus | null;
  /** O resultado do Motor (ADR-041) para este par. */
  compatibility?: CompatibilityResult;
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

/**
 * O que se sabe sobre o profissional num subcritério.
 *
 * A AUSÊNCIA de um item nesta lista não é igual a `NAO_INFORMADO`: o primeiro
 * é "ninguém olhou ainda", o segundo é "olharam e não havia". O Motor os
 * classifica igual — e é justamente por isso que o texto precisa separá-los.
 */
export type ProfessionalStateRef = {
  subcriterionCode: string;
  status: SubcriterionStatus;
  declaredBy?: string | null;
  declaredAt?: string | null;
};

export type OptionDraftInput = {
  professionalProfileId: string;
  /** O Mapa do Profissional — ADR-040. */
  states: ProfessionalStateRef[];
  /** A declaração de área que deixou esta opção participar. */
  areaDeclaration: AreaDeclarationRef | null;
  openCriticalDivergences: number;
  /**
   * ADR-065: a leitura relacional deste par (Case × profissional), já
   * cruzada pelo motor relacional. Ausente = Case sem bloco relacional
   * respondido (Relatórios antigos continuam gerando sem a seção).
   */
  relationalReadings?: readonly RelationalReading[];
};

export type PriorityRef = {
  subcriterionCode: string;
  importance: ImportanceLevel;
};

export type DraftInput = {
  /** A área que o Case exige — para a justificativa dizer contra o quê. */
  areaRequirement: string | null;
  /** O Mapa de Prioridades do Case — ADR-039/042. A única fonte da ordem. */
  priorities: PriorityRef[];
  /** Exatamente três, distintas, todas participantes. O gerador recusa o resto. */
  options: OptionDraftInput[];
  /** Injetável só para teste; em produção é sempre o catálogo canônico. */
  catalog?: readonly Subcriterion[];
};

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

export type OptionDraft = {
  professionalProfileId: string;
  justificativa: DraftField;
  relacaoPrioridades: DraftField;
  /**
   * ADR-065 — "Como esse caminho conversa com a forma como você quer ser
   * cuidada". Frases de célula são verbalização pura; conceitos humanos
   * entram como estado declarado e exigem o Curador (`requiresCurator`).
   */
  leituraRelacional: DraftField;
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
  /** A completude REAL do Mapa. O Relatório nunca afirma o que ela nega. */
  completude: PriorityMapCompletion;
  /** Limitações factuais do rascunho — declaradas, nunca preenchidas. */
  limitacoes: TracedSentence[];
  options: OptionDraft[];
};

// ---------------------------------------------------------------------------
// A leitura de um par (subcritério do Case × profissional)
// ---------------------------------------------------------------------------

/**
 * A origem factual, antes do Motor. Cinco casos, não quatro: `SEM_REGISTRO`
 * existe porque "ainda não foi investigado" e "foi investigado e não havia"
 * são coisas diferentes para quem vai conversar com o profissional.
 */
type FactualOrigin = SubcriterionStatus | "SEM_REGISTRO";

type Reading = {
  subcriterion: Subcriterion;
  importance: ImportanceLevel;
  origin: FactualOrigin;
  compatibility: CompatibilityResult;
};

function catalogOrder(a: Subcriterion, b: Subcriterion): number {
  return a.group === b.group
    ? a.displayOrder - b.displayOrder
    : SUBCRITERION_GROUPS.indexOf(a.group) - SUBCRITERION_GROUPS.indexOf(b.group);
}

/**
 * A ORDEM DO RELATÓRIO — e não existe segunda.
 *
 * Primeiro o que o Case declarou como mais importante; no empate, a ordem
 * canônica do catálogo. Nunca a ordem de gravação, que faria o mesmo Case
 * gerar textos diferentes conforme o Curador tivesse clicado antes ou depois.
 *
 * `importanceOrdinal` vem do domínio: a tabela 5/4/3/2/0 não é recopiada aqui.
 */
function readingsOf(
  option: OptionDraftInput,
  priorities: readonly PriorityRef[],
  catalog: readonly Subcriterion[],
): Reading[] {
  const porCodigo = new Map(catalog.map((entry) => [entry.code, entry]));
  const estados = new Map(option.states.map((entry) => [entry.subcriterionCode, entry.status]));

  return priorities
    .flatMap((priority) => {
      const subcriterion = porCodigo.get(priority.subcriterionCode);
      // Subcritério fora do catálogo ativo não vira frase: o Relatório fala do
      // Método vigente, e um item retirado de circulação não volta por aqui.
      if (!subcriterion || !subcriterion.active) return [];

      const status = estados.get(priority.subcriterionCode);

      return [
        {
          subcriterion,
          importance: priority.importance,
          origin: (status ?? "SEM_REGISTRO") as FactualOrigin,
          // Sem registro entra no Motor como ausência de informação — a mesma
          // classe de NAO_INFORMADO. O texto é que os separa.
          compatibility: crossOne(priority.importance, status ?? "NAO_INFORMADO"),
        },
      ];
    })
    .sort(
      (a, b) =>
        importanceOrdinal(b.importance) - importanceOrdinal(a.importance) ||
        catalogOrder(a.subcriterion, b.subcriterion),
    );
}

function provenanceOf(reading: Reading, option: OptionDraftInput): ProvenanceRef {
  const declarado = option.states.find(
    (entry) => entry.subcriterionCode === reading.subcriterion.code,
  );
  return {
    sourceType: reading.origin === "SEM_REGISTRO" ? "lacuna" : "mapa_do_profissional",
    subcriterion: reading.subcriterion.code,
    importance: reading.importance,
    status: reading.origin === "SEM_REGISTRO" ? null : reading.origin,
    compatibility: reading.compatibility,
    author: declarado?.declaredBy ?? null,
    declaredAt: declarado?.declaredAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// Frases — uma por origem factual, nunca uma por resultado do Motor
// ---------------------------------------------------------------------------

const IMPORTANCE_PHRASE: Record<ImportanceLevel, string> = {
  MUITO_IMPORTANTE: "foi considerado muito importante para este caso",
  IMPORTANTE: "foi classificado como importante",
  RELEVANTE: "foi classificado como relevante",
  POUCO_IMPORTANTE: "foi classificado como pouco importante",
  NAO_INFLUENCIA: "não influencia a decisão neste caso",
};

/**
 * Uma frase por leitura. O adjetivo nunca aparece: "muito importante" é o que
 * o Case declarou; "excelente profissional" seria o que ninguém declarou.
 *
 * A distinção entre as origens é o ponto: o Motor classifica `SEM_REGISTRO` e
 * `NAO_INFORMADO` na mesma `LACUNA_DE_INFORMACAO`, mas quem vai à consulta
 * precisa saber se a pergunta ainda não foi feita ou se já foi e não houve
 * resposta.
 */
function sentenceFor(reading: Reading, option: OptionDraftInput): TracedSentence {
  const nome = reading.subcriterion.name;
  const provenance = [provenanceOf(reading, option)];

  if (reading.compatibility === "NAO_RELEVANTE") {
    return { text: `${nome}: este aspecto não influencia a decisão neste caso.`, provenance };
  }

  const prefixo = `${nome} ${IMPORTANCE_PHRASE[reading.importance]}.`;

  switch (reading.origin) {
    case "CONFIRMADO":
      return {
        text: `${prefixo} A característica está confirmada para o profissional.`,
        provenance,
      };
    case "NAO_CONFIRMADO":
      // Nunca "incompatível": não confirmar não é negar.
      return {
        text: `${prefixo} A característica não foi confirmada para o profissional.`,
        provenance,
      };
    case "NAO_INFORMADO":
      return {
        text: `${prefixo} O item foi analisado, mas não há informação suficiente disponível.`,
        provenance,
      };
    case "SEM_REGISTRO":
      return {
        text: `${prefixo} Este item ainda não foi investigado para o profissional.`,
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
 * Por que esta opção está no Relatório. Ancorada no que o Case declarou como
 * mais importante E que está confirmado para o profissional — nunca num
 * "melhor colocado", que exigiria um ranking que este gerador não produz.
 */
function buildJustificativa(
  option: OptionDraftInput,
  readings: readonly Reading[],
  areaRequirement: string | null,
): DraftField {
  const sentences: TracedSentence[] = [];

  if (option.areaDeclaration) {
    const area = option.areaDeclaration;
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

  // As âncoras: os confirmados de maior importância, já na ordem do Mapa.
  const ancoras = readings
    .filter((r) => r.origin === "CONFIRMADO" && r.compatibility !== "NAO_RELEVANTE")
    .slice(0, 2);

  for (const ancora of ancoras) {
    sentences.push({
      text: `${ancora.subcriterion.name} ${IMPORTANCE_PHRASE[ancora.importance]}, e está confirmado para este profissional.`,
      provenance: [provenanceOf(ancora, option)],
    });
  }

  // Sem nenhuma confirmação não há justificativa honesta possível — e
  // inventá-la é exatamente o que este gerador existe para não fazer.
  return field(sentences, ancoras.length === 0);
}

/** A leitura completa, na ordem do Mapa. */
function buildRelacao(option: OptionDraftInput, readings: readonly Reading[]): DraftField {
  const sentences = readings.map((reading) => sentenceFor(reading, option));

  if (sentences.length > 0) {
    sentences[0] = {
      ...sentences[0]!,
      text: `Em relação ao Mapa de Prioridades: ${sentences[0]!.text}`,
    };
  }

  return field(sentences, sentences.length === 0);
}

/**
 * Pontos de atenção — obrigatórios, e nunca inventados. Se os dados não
 * produzirem nenhum, o campo fica pendente do Curador: "nenhum ponto de
 * atenção identificado" é uma frase que este gerador se recusa a escrever,
 * porque opção só com virtudes é recomendação.
 */
function buildAtencao(
  option: OptionDraftInput,
  readings: readonly Reading[],
): { items: TracedSentence[]; requiresCurator: boolean } {
  const items: TracedSentence[] = [];

  for (const reading of readings) {
    // O que não influencia não vira ponto de atenção: seria transformar uma
    // escolha dela em pendência.
    if (reading.compatibility === "NAO_RELEVANTE") continue;
    if (reading.origin === "CONFIRMADO") continue;
    items.push(sentenceFor(reading, option));
  }

  if (
    option.areaDeclaration?.compatibility === "PARCIALMENTE_COMPATIVEL" &&
    option.areaDeclaration.rationale
  ) {
    items.push({
      text: `Sobre a área de atuação: ${option.areaDeclaration.rationale}`,
      provenance: [
        {
          sourceType: "declaracao_de_area",
          author: option.areaDeclaration.declaredBy,
          declaredAt: option.areaDeclaration.declaredAt,
        },
      ],
    });
  }

  if (option.openCriticalDivergences > 0) {
    items.push({
      text: `Há ${option.openCriticalDivergences} divergência(s) em aberto entre fontes no cadastro deste profissional — as duas versões estão registradas e aguardam resolução.`,
      provenance: [{ sourceType: "divergencia" }],
    });
  }

  return { items, requiresCurator: items.length === 0 };
}

/** Confirmações que a justificativa não citou — sem repeti-la inteira. */
function buildFavoraveis(
  option: OptionDraftInput,
  readings: readonly Reading[],
  justificativa: DraftField,
): TracedSentence[] {
  const citados = new Set(
    justificativa.sentences.flatMap((sentence) =>
      sentence.provenance.map((ref) => ref.subcriterion),
    ),
  );

  return readings
    .filter((r) => r.origin === "CONFIRMADO" && r.compatibility !== "NAO_RELEVANTE")
    .filter((r) => !citados.has(r.subcriterion.code))
    .map((reading) => sentenceFor(reading, option));
}

/**
 * Perguntas determinísticas, cada uma amarrada a uma lacuna real deste
 * dossiê. Pergunta genérica não nasce aqui — e o que não influencia o caso
 * nunca vira pergunta.
 */
function buildPerguntas(
  option: OptionDraftInput,
  readings: readonly Reading[],
): TracedSentence[] {
  return readings
    .filter((r) => r.compatibility === "LACUNA_DE_INFORMACAO")
    .map((reading) => ({
      text:
        reading.origin === "SEM_REGISTRO"
          ? `Sobre ${reading.subcriterion.name.toLowerCase()}: este item ainda não foi investigado — vale levantar na conversa.`
          : `Sobre ${reading.subcriterion.name.toLowerCase()}: não houve informação suficiente — vale confirmar na conversa.`,
      provenance: [provenanceOf(reading, option)],
    }));
}

function buildLacunas(readings: readonly Reading[]): string[] {
  return readings
    .filter((r) => r.compatibility === "LACUNA_DE_INFORMACAO")
    .map((r) => r.subcriterion.name);
}

/**
 * As limitações do rascunho — declaradas, nunca contornadas.
 *
 * Um Mapa parcial não impede gerar: é informação que precisa aparecer junto
 * do texto. Simular completude seria a única saída desonesta.
 */
function buildLimitacoes(
  completude: PriorityMapCompletion,
  readings: readonly (readonly Reading[])[],
): TracedSentence[] {
  const limitacoes: TracedSentence[] = [];
  const todas = readings.flat();

  if (completude.status !== "COMPLETE") {
    limitacoes.push({
      text:
        completude.status === "NOT_STARTED"
          ? "O Mapa de Prioridades ainda não foi iniciado: este rascunho não representa o que importa para esta pessoa."
          : `O Mapa de Prioridades está em construção — ${completude.completed} de ${completude.total} subcritérios classificados. As conclusões abaixo valem apenas sobre o que já foi classificado.`,
      provenance: [{ sourceType: "completude_do_mapa" }],
    });
  }

  const semRegistro = todas.filter((r) => r.origin === "SEM_REGISTRO").length;
  if (semRegistro > 0) {
    limitacoes.push({
      text: `Há ${semRegistro} item(ns) ainda não investigado(s) no Mapa de um ou mais profissionais.`,
      provenance: [{ sourceType: "lacuna" }],
    });
  }

  if (todas.length > 0 && todas.every((r) => r.compatibility === "NAO_RELEVANTE")) {
    limitacoes.push({
      text: "Todos os subcritérios classificados foram declarados como não influentes neste caso — o Relatório não tem base declarada para diferenciar as opções.",
      provenance: [{ sourceType: "mapa_de_prioridades" }],
    });
  }

  return limitacoes;
}

// ---------------------------------------------------------------------------
// A leitura relacional — ADR-065 (documento normativo, Parte 6)
// ---------------------------------------------------------------------------

/**
 * A frase-sentinela do juízo humano pendente — B-1 (RELEASE BLOCKERS).
 *
 * UMA fonte só: o gerador a escreve, a guarda de emissão a procura. Um
 * Relatório emitido jamais pode carregá-la — seria o documento definitivo
 * prometendo uma leitura que nunca virá (ADR-064).
 */
export const FRASE_SENTINELA_JUIZO = "esta leitura aguarda a conversa com o Curador";

/**
 * A composição que o rascunho assistido escreve — B-2 (RELEASE BLOCKERS).
 *
 * Mesma física da frase-sentinela do juízo relacional, aplicada à única prosa
 * de abertura que a paciente lê: é texto de TRABALHO INTERNO, dirigido ao
 * Curador ("Revisão do Curador pendente"), e por isso jamais pode chegar ao
 * documento definitivo. UMA fonte só: o gerador a escreve
 * (`relatorio-assistido.ts`), a guarda de emissão a procura (ADR-064).
 */
export const FRASE_COMPOSICAO_RASCUNHO =
  "Rascunho assistido — três caminhos legítimos, construídos sobre o que foi declarado e verificado. Revisão do Curador pendente.";

/**
 * B-2: a composição ainda não é do Curador — porque está vazia ou porque
 * continua sendo a frase de trabalho do gerador. Pura e determinística: a
 * action de emissão a consulta antes de emitir.
 *
 * Vazio conta como pendente por fail-closed: `curadoria_reports
 * .composition_rationale` é NULLABLE no banco, e um documento definitivo sem a
 * frase de abertura do Curador é a mesma promessa vazia, sem texto nenhum.
 */
export function composicaoPendenteDoCurador(
  compositionRationale: string | null,
): "AUSENTE" | "DO_SISTEMA" | null {
  const texto = (compositionRationale ?? "").trim();
  if (texto === "") return "AUSENTE";
  if (texto === FRASE_COMPOSICAO_RASCUNHO) return "DO_SISTEMA";
  return null;
}

/**
 * B-1: as pendências de juízo relacional de um conjunto de opções — cada
 * linha-sentinela ainda presente no texto, com o conceito nomeado.
 * Pura e determinística: a action de emissão a consulta antes de emitir.
 */
export function pendenciasDeJuizoRelacional(
  options: readonly { professionalProfileId: string; relationalReading: string | null }[],
): { professionalProfileId: string; conceito: string }[] {
  const pendencias: { professionalProfileId: string; conceito: string }[] = [];
  for (const option of options) {
    if (!option.relationalReading) continue;
    for (const linha of option.relationalReading.split("\n")) {
      const match = linha.match(/^Sobre (.+): esta leitura aguarda a conversa com o Curador\.\s*$/);
      if (match) {
        pendencias.push({ professionalProfileId: option.professionalProfileId, conceito: match[1]! });
      }
    }
  }
  return pendencias;
}

/** Como cada grau abre a frase — a linguagem dela, nunca a da matriz. */
const DEGREE_PREFIX: Record<NeedDegree, string> = {
  ESSENCIAL: "Para você é essencial",
  PESA_MUITO: "Pesa muito para você",
  DESEJAVEL: "Você disse que seria bem-vindo",
  SEM_PREFERENCIA: "", // células SEM_PREFERENCIA são NAO_RELEVANTE — sem frase
};

const DEGREE_RANK: Record<NeedDegree, number> = {
  ESSENCIAL: 0,
  PESA_MUITO: 1,
  DESEJAVEL: 2,
  SEM_PREFERENCIA: 3,
};

function minusculaInicial(texto: string): string {
  return texto.length > 0 ? texto[0]!.toLowerCase() + texto.slice(1) : texto;
}

/**
 * B-1: as opções da pessoa com correspondência universal (`satisfied_by =
 * ["*"]` no Catálogo). A frase delas é própria: verbalizar "todas as condutas
 * declaradas" para quem pediu o oposto (ex.: prefere ficar sozinha) soaria
 * como contradição. Lido do Catálogo — nenhuma lista paralela.
 */
const OPCOES_UNIVERSAIS: ReadonlySet<string> = new Set(
  RELATIONAL_CONCEPTS.flatMap((concept) =>
    concept.paciente
      .filter((campo) => campo.field === "principal")
      .flatMap((campo) =>
        campo.options
          .filter((opcao) => opcao.active && opcao.satisfiedBy?.includes("*"))
          .map((opcao) => `${concept.code}:${opcao.value}`),
      ),
  ),
);

/**
 * As frases da seção relacional. Toda frase de célula é VERBALIZAÇÃO de um
 * par (opção da pessoa × conduta declarada) — nunca inferência, nunca
 * adjetivo. Conceito humano entra como estado declarado: a frase dele só
 * chega ao paciente depois da leitura do Curador (`requiresCurator`).
 *
 * Ordem: grau da pessoa (desc), empate pela ordem do Catálogo — a mesma
 * regra de ordenação de leitura do restante do Relatório.
 */
function buildLeituraRelacional(readings: readonly RelationalReading[]): DraftField {
  const ordenadas = [...readings].sort((a, b) => DEGREE_RANK[a.degree] - DEGREE_RANK[b.degree]);
  const sentences: TracedSentence[] = [];
  let requiresCurator = false;

  for (const reading of ordenadas) {
    if (reading.kind === "JUIZO_HUMANO") {
      requiresCurator = true;
      sentences.push({
        text: `Sobre ${minusculaInicial(reading.conceptName)}: ${FRASE_SENTINELA_JUIZO}.`,
        provenance: [
          {
            sourceType: "leitura_relacional",
            subcriterion: reading.code,
            status: reading.hasEvidence ? "CONFIRMADO" : null,
          },
        ],
      });
      continue;
    }

    if (reading.result === "NAO_RELEVANTE") continue;
    const prefixo = DEGREE_PREFIX[reading.degree];

    for (const match of reading.matches) {
      const pedido = minusculaInicial(match.personLabel);
      const provenance: ProvenanceRef[] = [
        {
          sourceType: "leitura_relacional",
          subcriterion: reading.code,
          status: reading.state,
          compatibility: reading.result,
        },
      ];

      if (reading.state === "NAO_INFORMADO") {
        sentences.push({
          text: `${prefixo} ${pedido}. Ainda não há registro sobre como este profissional conduz esse ponto.`,
          provenance,
        });
      } else if (match.satisfied && OPCOES_UNIVERSAIS.has(`${reading.code}:${match.personOption}`)) {
        // B-1: correspondência universal — a frase diz que nada impede o que
        // ela pediu, em vez de listar condutas que soariam como contradição.
        sentences.push({
          text: `${prefixo} ${pedido}. Nada nas condutas declaradas por este profissional impede isso.`,
          provenance,
        });
      } else if (match.satisfied) {
        const condutas = match.matchedConducts
          .map((conduta) => minusculaInicial(relationalConductLabel(reading.code, conduta)))
          .join("; ");
        sentences.push({
          text: `${prefixo} ${pedido}. Este profissional declara que ${condutas}.`,
          provenance,
        });
      } else {
        sentences.push({
          text: `${prefixo} ${pedido}. Essa conduta não está entre as declaradas por este profissional.`,
          provenance,
        });
      }
    }
  }

  return {
    sentences,
    text: sentences.map((sentence) => sentence.text).join("\n"),
    requiresCurator,
  };
}

/** Lacunas relacionais entram nos pontos de atenção (ADR-065 §11.3). */
function relationalAttentionItems(readings: readonly RelationalReading[]): TracedSentence[] {
  return readings
    .filter(
      (reading): reading is Extract<RelationalReading, { kind: "CELULA" }> =>
        reading.kind === "CELULA" && reading.result === "LACUNA_DE_INFORMACAO",
    )
    .map((reading) => ({
      text: `Sobre ${minusculaInicial(reading.conceptName)}: ainda não há registro — vale levantar na conversa.`,
      provenance: [
        {
          sourceType: "leitura_relacional" as const,
          subcriterion: reading.code,
          status: reading.state,
          compatibility: reading.result,
        },
      ],
    }));
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

  const catalog = input.catalog ?? SUBCRITERION_CATALOG;
  // A completude vem do domínio. O Relatório não tem uma segunda definição de
  // "completo" — ter duas é como elas divergem.
  const completude = priorityMapCompletion(input.priorities, catalog);

  const porOpcao = input.options.map((option) => readingsOf(option, input.priorities, catalog));

  const options = input.options.map((option, indice) => {
    const readings = porOpcao[indice]!;
    const justificativa = buildJustificativa(option, readings, input.areaRequirement);
    const relacionais = option.relationalReadings ?? [];

    // ADR-065 §11.3: as lacunas relacionais entram nos pontos de atenção ao
    // lado das assistenciais — a atenção do Curador não distingue a leitura
    // de origem, só a pendência.
    const atencao = buildAtencao(option, readings);
    const atencaoRelacional = relationalAttentionItems(relacionais);
    const pontosDeAtencao = {
      items: [...atencao.items, ...atencaoRelacional],
      requiresCurator: atencao.items.length + atencaoRelacional.length === 0,
    };

    return {
      professionalProfileId: option.professionalProfileId,
      justificativa,
      relacaoPrioridades: buildRelacao(option, readings),
      leituraRelacional: buildLeituraRelacional(relacionais),
      pontosDeAtencao,
      pontosFavoraveis: buildFavoraveis(option, readings, justificativa),
      perguntasSugeridas: buildPerguntas(option, readings),
      observacoesDoCurador: "" as const,
      lacunas: buildLacunas(readings),
    };
  });

  return {
    generatorVersion: GENERATOR_VERSION,
    completude,
    limitacoes: buildLimitacoes(completude, porOpcao),
    options,
  };
}
