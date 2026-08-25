/**
 * A INVESTIGAÇÃO — o raciocínio do Curador, lido a partir do estado da Mesa.
 *
 * O Curador não está preenchendo um sistema; ele está conduzindo uma
 * investigação. Este módulo não cria regra, critério, peso ou registro: ele
 * apenas **lê** o que já existe na Mesa e devolve as frases que ajudam a
 * pensar — onde o raciocínio está, o que ainda merece atenção, e o que as
 * declarações do próprio Curador indicam até aqui.
 *
 * Tudo aqui é efêmero e derivado. Nada disso é persistido, nada disso vira
 * contrato de domínio, e nada disso sobrevive a um reload — se sobrevivesse,
 * seria um novo dado clínico entrando pela porta dos fundos.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { ASSESSMENT_LABELS, type Assessment, type CruzamentoCriterion } from "./cruzamento";
import { IMPORTANCE_LABELS, type ImportanceLevel } from "./mapa-prioridades";
import type { CompatibilityResult } from "./motor-compatibilidade";
import type { EligibilityState } from "./mesa-cruzamento-view";
import type { MesaEtapaId } from "./mesa-etapas";

// ---------------------------------------------------------------------------
// Linha de investigação — o raciocínio, não o workflow
// ---------------------------------------------------------------------------

export const LINHA_INVESTIGACAO = ["HIPOTESE", "EVIDENCIAS", "CONFERENCIA", "CONCLUSAO"] as const;

export type LinhaEtapaId = (typeof LINHA_INVESTIGACAO)[number];

export const LINHA_LABELS: Record<LinhaEtapaId, string> = {
  HIPOTESE: "Hipótese",
  EVIDENCIAS: "Evidências",
  CONFERENCIA: "Conferência",
  CONCLUSAO: "Conclusão",
};

export type LinhaEtapaState = {
  id: LinhaEtapaId;
  label: string;
  status: "percorrida" | "agora" | "adiante";
};

export type InvestigacaoFacts = {
  /** O Mapa de Prioridades do Case está completo (M4: era `budgetsComplete`). */
  mapaCompleto: boolean;
  eligible: number;
  /** Critérios já declarados, somados entre os elegíveis. */
  criteriaDeclared: number;
  /** Critérios esperados, somados entre os elegíveis. */
  criteriaTotal: number;
  selected: number;
};

/**
 * Onde o raciocínio está. Não é o workflow — o workflow são as sete etapas da
 * Mesa, que o Curador percorre na ordem que quiser. Isto é o movimento mental:
 * levantar a hipótese, reunir evidência, conferir, concluir.
 */
export function linhaDeInvestigacao(facts: InvestigacaoFacts): LinhaEtapaState[] {
  const atual: LinhaEtapaId =
    facts.selected >= 3
      ? "CONCLUSAO"
      : facts.criteriaTotal > 0 && facts.criteriaDeclared >= facts.criteriaTotal
        ? "CONFERENCIA"
        : facts.criteriaDeclared > 0
          ? "EVIDENCIAS"
          : "HIPOTESE";

  const indice = LINHA_INVESTIGACAO.indexOf(atual);

  return LINHA_INVESTIGACAO.map((id, posicao) => ({
    id,
    label: LINHA_LABELS[id],
    status: posicao < indice ? "percorrida" : posicao === indice ? "agora" : "adiante",
  }));
}

// ---------------------------------------------------------------------------
// O profissional, do ponto de vista da investigação
// ---------------------------------------------------------------------------

export type InvestigacaoProfissional = {
  id: string;
  nome: string;
  estado: EligibilityState;
  /** A área foi declarada compatível/incompatível pelo Curador? */
  areaDeclarada: boolean;
  /** Fontes divergem sobre a área de atuação. */
  temDivergencia: boolean;
  /** Filtros obrigatórios cuja informação não foi localizada. */
  filtrosSemInformacao: number;
  /** Critérios ainda sem declaração do Curador — regime `LEGADO_6XN`. */
  criteriosPendentes: number;
  /** Critérios declarados como informação insuficiente. */
  criteriosInsuficientes: number;
  /**
   * JUÍZOS que a ADR-067 §5 exige e ainda não têm versão vigente.
   *
   * Por que é um campo PRÓPRIO, e não um número somado a `criteriosPendentes`:
   * são duas coisas do Método, e confundi-las já custou caro uma vez. O
   * `SIM-40` nasceu exatamente de alguém escrever "três conceitos" onde o
   * Método exige seis juízos — critério e juízo não são a mesma unidade, e
   * uma frase que diz "N critérios sem avaliação" para contar juízos ensina o
   * erro de novo.
   *
   * `criteriosPendentes` conta `criterion_declarations`, do regime `LEGADO_6XN`
   * (atrás de flag). Este conta o que o regime `JUIZO` — o padrão — exige.
   *
   * Opcional porque a Mesa antiga não o alimenta: ela sai com a ADR-093, e
   * fazê-la calcular isto agora seria construir sobre o que vai ser demolido.
   */
  juizosPendentes?: number;
};

/** Já avaliado = nenhum critério sem declaração, e há algo a avaliar. */
export function foiAvaliado(profissional: InvestigacaoProfissional): boolean {
  return profissional.estado === "ELEGIVEL" && profissional.criteriosPendentes === 0;
}

// ---------------------------------------------------------------------------
// Filtros instantâneos — recortam a leitura, nunca a Rede
// ---------------------------------------------------------------------------

export const MESA_FILTROS = [
  "DIVERGENCIA",
  "INSUFICIENTE",
  "SEM_DECLARACAO",
  "AREA_COMPATIVEL",
  "AVALIADO",
  "PENDENTE",
] as const;

export type MesaFiltroId = (typeof MESA_FILTROS)[number];

export const MESA_FILTRO_LABELS: Record<MesaFiltroId, string> = {
  DIVERGENCIA: "Com divergência",
  INSUFICIENTE: "Informação insuficiente",
  SEM_DECLARACAO: "Sem declaração",
  AREA_COMPATIVEL: "Área compatível",
  AVALIADO: "Já avaliado",
  PENDENTE: "Pendente",
};

const PREDICADOS: Record<MesaFiltroId, (p: InvestigacaoProfissional) => boolean> = {
  DIVERGENCIA: (p) => p.temDivergencia,
  INSUFICIENTE: (p) => p.filtrosSemInformacao > 0 || p.criteriosInsuficientes > 0,
  SEM_DECLARACAO: (p) => !p.areaDeclarada,
  AREA_COMPATIVEL: (p) => p.estado === "ELEGIVEL",
  AVALIADO: foiAvaliado,
  PENDENTE: (p) => p.estado === "PENDENTE_DE_INFORMACAO" || p.criteriosPendentes > 0,
};

export type FiltroView = {
  id: MesaFiltroId;
  label: string;
  /** Quantos profissionais este filtro alcança. Zero continua visível. */
  count: number;
  ativo: boolean;
};

export function filtrosDisponiveis(
  profissionais: InvestigacaoProfissional[],
  ativos: MesaFiltroId[],
): FiltroView[] {
  return MESA_FILTROS.map((id) => ({
    id,
    label: MESA_FILTRO_LABELS[id],
    count: profissionais.filter(PREDICADOS[id]).length,
    ativo: ativos.includes(id),
  }));
}

/**
 * Filtros somam (OU): marcar "com divergência" e "pendente" mostra os dois
 * conjuntos. Sem filtro ativo, a Rede inteira — o padrão nunca esconde nada.
 */
export function aplicarFiltros(
  profissionais: InvestigacaoProfissional[],
  ativos: MesaFiltroId[],
): InvestigacaoProfissional[] {
  if (ativos.length === 0) return profissionais;
  return profissionais.filter((profissional) =>
    ativos.some((filtro) => PREDICADOS[filtro](profissional)),
  );
}

/**
 * A frase que acompanha qualquer recorte. Um filtro que esconde metade da
 * Rede em silêncio faz o Curador decidir sobre um universo que ele acha que é
 * o todo — por isso o número exibido/total nunca é opcional.
 */
export function recorteSentence(exibidos: number, total: number, ativos: number): string {
  if (ativos === 0) return `${total} profissiona${total === 1 ? "l" : "is"} na Rede deste Case.`;
  return `${exibidos} de ${total} exibido${exibidos === 1 ? "" : "s"} — ${ativos} filtro${ativos === 1 ? "" : "s"} ativo${ativos === 1 ? "" : "s"}.`;
}

// ---------------------------------------------------------------------------
// Painel inteligente — só o que ainda merece atenção
// ---------------------------------------------------------------------------

export type AtencaoTipo =
  | "DIVERGENCIA"
  | "INSUFICIENTE"
  | "DECLARACAO"
  | "AVALIACAO"
  /** Juízo humano exigido pela ADR-067 §5 e ainda sem versão vigente. */
  | "JUIZO";

export type AtencaoItem = {
  id: string;
  tipo: AtencaoTipo;
  /** De quem se trata. */
  quem: string;
  /** O que merece atenção, em uma frase. */
  frase: string;
  /** Onde isso se resolve. */
  etapa: MesaEtapaId;
};

/**
 * O painel lateral parava de ser lido porque repetia tudo — inclusive o que
 * já estava resolvido. Aqui ele devolve **apenas** o que ainda está aberto, na
 * ordem em que atrapalha: divergência, lacuna, declaração, avaliação.
 *
 * Lista vazia é resposta legítima e significa exatamente uma coisa: nada
 * pendente. Quem chama deve dizer isso, não esconder o painel.
 */
export function itensDeAtencao(profissionais: InvestigacaoProfissional[]): AtencaoItem[] {
  const itens: AtencaoItem[] = [];

  for (const profissional of profissionais) {
    if (profissional.temDivergencia) {
      itens.push({
        id: `${profissional.id}:divergencia`,
        tipo: "DIVERGENCIA",
        quem: profissional.nome,
        frase: "Fontes divergem sobre a área de atuação registrada.",
        etapa: "REDE",
      });
    }
  }

  for (const profissional of profissionais) {
    if (profissional.filtrosSemInformacao > 0) {
      itens.push({
        id: `${profissional.id}:filtros`,
        tipo: "INSUFICIENTE",
        quem: profissional.nome,
        frase:
          profissional.filtrosSemInformacao === 1
            ? "1 filtro obrigatório sem informação localizada — verificar o cadastro, não descartar."
            : `${profissional.filtrosSemInformacao} filtros obrigatórios sem informação localizada — verificar o cadastro, não descartar.`,
        etapa: "REDE",
      });
    }
    if (profissional.criteriosInsuficientes > 0) {
      itens.push({
        id: `${profissional.id}:insuficientes`,
        tipo: "INSUFICIENTE",
        quem: profissional.nome,
        // S-4(texto): "declarados" era falso em dois dos três casos somados
        // aqui — lacuna assistencial sem registro e lacuna relacional sem
        // evidência são justamente "ninguém declarou". A frase passa a
        // descrever o que se conta, sem afirmar ato que não houve. O NÚMERO
        // não muda: o que a contagem deve medir é decisão normativa pendente.
        frase:
          profissional.criteriosInsuficientes === 1
            ? "1 critério sem informação suficiente."
            : `${profissional.criteriosInsuficientes} critérios sem informação suficiente.`,
        etapa: "AVALIACAO",
      });
    }
  }

  for (const profissional of profissionais) {
    if (!profissional.areaDeclarada) {
      itens.push({
        id: `${profissional.id}:declaracao`,
        tipo: "DECLARACAO",
        quem: profissional.nome,
        frase: "A compatibilidade de área ainda não foi declarada.",
        etapa: "REDE",
      });
    }
  }

  // O JUÍZO vem antes da avaliação legada de propósito: no regime `JUIZO` —
  // o padrão — é ele que conclui a etapa, e é dele que a paciente lê o
  // resultado. A avaliação 6×N sobrevive atrás de flag.
  for (const profissional of profissionais) {
    const pendentes = profissional.juizosPendentes ?? 0;
    if (profissional.estado === "ELEGIVEL" && pendentes > 0) {
      itens.push({
        id: `${profissional.id}:juizo`,
        tipo: "JUIZO",
        quem: profissional.nome,
        frase:
          pendentes === 1
            ? "1 juízo seu ainda não foi registrado."
            : `${pendentes} juízos seus ainda não foram registrados.`,
        etapa: "AVALIACAO",
      });
    }
  }

  for (const profissional of profissionais) {
    if (profissional.estado === "ELEGIVEL" && profissional.criteriosPendentes > 0) {
      itens.push({
        id: `${profissional.id}:avaliacao`,
        tipo: "AVALIACAO",
        quem: profissional.nome,
        frase:
          profissional.criteriosPendentes === 1
            ? "1 critério sem avaliação."
            : `${profissional.criteriosPendentes} critérios sem avaliação.`,
        etapa: "AVALIACAO",
      });
    }
  }

  return itens;
}

// ---------------------------------------------------------------------------
// Painel de hipóteses — a leitura devolvida, jamais uma recomendação
// ---------------------------------------------------------------------------

export type HipoteseStatus = "EM_INVESTIGACAO" | "PARCIALMENTE_CONFERIDA" | "CONFERIDA";

export const HIPOTESE_STATUS_LABELS: Record<HipoteseStatus, string> = {
  EM_INVESTIGACAO: "Em investigação",
  PARCIALMENTE_CONFERIDA: "Parcialmente conferida",
  CONFERIDA: "Conferida",
};

export type HipoteseCelula = {
  label: string;
  /** O nível que o Case declarou — ADR-042, no lugar do bloco de orçamento. */
  importancia: ImportanceLevel;
  resultado: CompatibilityResult;
};

export type HipoteseFacts = {
  professionalProfileId: string;
  nome: string;
  celulas: HipoteseCelula[];
  /** Rótulos dos critérios ainda sem declaração. */
  pendentes: string[];
};

export type Hipotese = {
  professionalProfileId: string;
  nome: string;
  status: HipoteseStatus;
  /** O que as declarações registradas indicam — sempre no passado, sempre do Curador. */
  frase: string;
  /** O que ainda falta conferir. */
  lacunas: string[];
};



/**
 * A hipótese é a leitura do que o **Curador já declarou**, devolvida para ele
 * conseguir enxergar o próprio raciocínio — nunca a opinião da Mesa sobre
 * quem é melhor.
 *
 * A distinção não é estilística. Uma frase como "este profissional responde
 * muito bem" seria o sistema recomendando com voz macia, e a recomendação é do
 * Curador (ADR-035). Por isso: nada comparativo entre profissionais, nada de
 * superlativo, nenhuma sugestão de escolha — só o padrão que as declarações
 * dele desenham, e o que falta para fechá-lo.
 */
export function hipoteseDe(facts: HipoteseFacts): Hipotese {
  // ADR-042 — a hipótese lê o Motor. Alta compatibilidade é o que o Case
  // declarou como importante E que está confirmado para o profissional.
  const altos = facts.celulas.filter((c) => c.resultado === "ALTA_COMPATIBILIDADE");
  const insuficientes = facts.celulas.filter((c) => c.resultado === "LACUNA_DE_INFORMACAO");

  const porNivel = (["MUITO_IMPORTANTE", "IMPORTANTE"] as const)
    .map((nivel) => {
      const doNivel = altos.filter((c) => c.importancia === nivel);
      if (doNivel.length === 0) return null;
      return `${doNivel.map((c) => c.label).join(" e ")} (${IMPORTANCE_LABELS[nivel].toLowerCase()})`;
    })
    .filter((trecho): trecho is string => trecho !== null);

  const frase =
    porNivel.length > 0
      ? `Você encontrou alta compatibilidade em ${porNivel.join("; ")}.`
      : facts.celulas.some((c) => c.resultado !== "LACUNA_DE_INFORMACAO")
        ? "As declarações registradas até aqui não desenham um padrão de alta compatibilidade."
        : "Ainda não há declaração registrada para este profissional.";

  const lacunas = [
    ...facts.pendentes.map((label) => `${label}: sem avaliação registrada.`),
    ...insuficientes.map((c) => `${c.label}: ${ASSESSMENT_LABELS.INFORMACAO_INSUFICIENTE.toLowerCase()}.`),
  ];

  const status: HipoteseStatus =
    facts.pendentes.length > 0
      ? "EM_INVESTIGACAO"
      : insuficientes.length > 0
        ? "PARCIALMENTE_CONFERIDA"
        : "CONFERIDA";

  return {
    professionalProfileId: facts.professionalProfileId,
    nome: facts.nome,
    status,
    frase,
    lacunas,
  };
}

// ---------------------------------------------------------------------------
// Estados visuais — identidade própria, nunca só cor
// ---------------------------------------------------------------------------

export type CelulaEstado = "PLENO" | "PARCIAL" | "NAO_ATENDE" | "INSUFICIENTE" | "SEM_DECLARACAO";

/** Marca, rótulo e classe: quem não vê cor recebe a mesma informação. */
export const CELULA_MARCA: Record<CelulaEstado, string> = {
  PLENO: "✓",
  PARCIAL: "◐",
  NAO_ATENDE: "✕",
  INSUFICIENTE: "⚠",
  SEM_DECLARACAO: "–",
};

export const CELULA_LABEL: Record<CelulaEstado, string> = {
  PLENO: "atende plenamente",
  PARCIAL: "atende parcialmente",
  NAO_ATENDE: "não atende",
  INSUFICIENTE: "informação insuficiente",
  SEM_DECLARACAO: "sem declaração",
};

export function celulaEstado(assessment: Assessment | null): CelulaEstado {
  switch (assessment) {
    case "ATENDE_PLENAMENTE":
      return "PLENO";
    case "ATENDE_PARCIALMENTE":
      return "PARCIAL";
    case "NAO_ATENDE":
      return "NAO_ATENDE";
    case "INFORMACAO_INSUFICIENTE":
      return "INSUFICIENTE";
    default:
      return "SEM_DECLARACAO";
  }
}

export const CRITERION_BLOCO: Record<CruzamentoCriterion, "TECNICO" | "PRIORIDADES"> = {
  FORMACAO: "TECNICO",
  EXPERIENCIA: "TECNICO",
  HISTORICO: "TECNICO",
  ACESSO: "PRIORIDADES",
  CONTINUIDADE_DO_CUIDADO: "PRIORIDADES",
  MODELO_DE_ATENDIMENTO: "PRIORIDADES",
};
