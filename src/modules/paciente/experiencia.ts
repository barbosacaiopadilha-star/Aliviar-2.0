/**
 * EXPERIÊNCIA DO PACIENTE — projeções puras.
 *
 * O Dashboard do Paciente não conhece o motor. Ele conhece três coisas: o
 * Perfil validado da pessoa, a narrativa do Relatório e o estado da jornada.
 * Este módulo projeta as duas primeiras em linguagem de pessoa — a jornada já
 * tem a sua projeção própria (jornada.ts).
 *
 * O que nunca atravessa: número de pontos, cálculo, cobertura, ranking,
 * posição, nome de mecanismo. O paciente acompanha a própria história, nunca
 * notas. Verificado por teste.
 *
 * Puro e determinístico: sem banco, sem rede, sem data do sistema.
 */

import {
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  SUBCRITERION_CATALOG,
  type ImportanceLevel,
  type Subcriterion,
} from "@/modules/curadoria/mapa-prioridades";
import type { JornadaStageId } from "@/modules/curadoria/jornada";

// ---------------------------------------------------------------------------
// O Perfil — o que importa, nas palavras dela (ADR-042)
// ---------------------------------------------------------------------------

export type PerfilNivel = {
  level: ImportanceLevel;
  /** O rótulo que a pessoa lê. */
  label: string;
  /** Os subcritérios naquele nível, nas palavras do catálogo. */
  itens: string[];
};

export type PerfilView = {
  /**
   * O que importa, agrupado por nível — na ordem da escala, do que mais pesa
   * ao que ela disse que não pesa. Só entram níveis que têm item.
   */
  prioridades: PerfilNivel[];
  /** Quantos subcritérios ela já classificou, de quantos existem. */
  classificados: number;
  total: number;
  validated: boolean;
  /** A frase do topo da seção, no estado atual. */
  headline: string;
};

/**
 * O Perfil como ela o entende — ADR-042.
 *
 * Antes este cartão mostrava distribuição de pontos ("40 pts / 35 pts").
 * Ponto é mecanismo interno: dizia como a Aliviar pondera, não o que ela
 * escolheu. Agora responde a pergunta dela — "o que mais importa para o meu
 * caso" — com os fatores agrupados pelo peso que ela mesma deu.
 *
 * Nenhum número de ponderação atravessa. Os níveis que ela declarou como
 * pouco importantes ou sem influência aparecem também: esconder o que ela
 * escolheu deixar de fora seria editar as palavras dela.
 */
export function buildPerfilView(
  itens: readonly { subcriterionCode: string; importance: ImportanceLevel }[],
  validated: boolean,
  catalogo: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): PerfilView {
  const nomePorCodigo = new Map(catalogo.map((entry) => [entry.code, entry.name]));
  const ativos = catalogo.filter((entry) => entry.active);

  const declarados = itens.filter((item) => nomePorCodigo.has(item.subcriterionCode));

  const prioridades: PerfilNivel[] = IMPORTANCE_LEVELS.map((level) => ({
    level,
    label: IMPORTANCE_LABELS[level],
    itens: declarados
      .filter((item) => item.importance === level)
      .map((item) => nomePorCodigo.get(item.subcriterionCode)!)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  })).filter((nivel) => nivel.itens.length > 0);

  const classificados = declarados.length;

  return {
    prioridades,
    classificados,
    total: ativos.length,
    validated,
    headline: validated
      ? "Este Perfil é seu — você o reconheceu, e é ele que guia a Curadoria."
      : classificados > 0
        ? "Seu perfil está sendo construído junto com o Curador."
        : "Seu Perfil nasce da conversa com o Curador — é por ele que a Curadoria começa.",
  };
}

// ---------------------------------------------------------------------------
// A mensagem principal, por etapa da jornada
// ---------------------------------------------------------------------------

/**
 * Uma frase por etapa, sempre sobre a história — nunca sobre mecanismo. As
 * frases respondem "o que a equipe está fazendo" e "o que acontece depois",
 * que é o que a pessoa quer saber ao abrir a tela.
 */
export const STAGE_MESSAGES: Record<JornadaStageId, string> = {
  CONSULTA_INICIAL: "Estamos ouvindo a sua história — tudo começa por ela.",
  PERFIL_DE_PRIORIDADES:
    "Seu Perfil está sendo construído junto com o Curador. A Curadoria só começa quando você o reconhecer como seu.",
  CURADORIA:
    "Nossa equipe está comparando profissionais que respondam às prioridades que você definiu.",
  DOSSIE: "Sua Curadoria está pronta. Agora você conhecerá os três caminhos selecionados.",
  REUNIAO: "Vamos conversar sobre os três caminhos — a apresentação é sempre uma conversa, nunca um anexo.",
  ESCOLHA:
    "Agora você possui as informações necessárias para decidir qual caminho faz mais sentido para você. A escolha é sua, no seu tempo.",
  ACOMPANHAMENTO: "O Concierge assumiu o acompanhamento do seu caso.",
};

export function mensagemPrincipal(currentStage: JornadaStageId): string {
  return STAGE_MESSAGES[currentStage];
}

/**
 * A jornada como caminhada: passado, presente e futuro — três estados, não
 * quatro. `AGUARDANDO_VOCE` e `EM_ANDAMENTO` viram ambos "atual" porque, no
 * caminho, a diferença entre "a equipe trabalha" e "é a sua vez" pertence à
 * frase da etapa, não à marca no percurso.
 */
export type WalkStatus = "done" | "current" | "ahead";

export function walkStatusOf(
  stageStatus: "CONCLUIDA" | "EM_ANDAMENTO" | "AGUARDANDO_VOCE" | "A_CAMINHO",
): WalkStatus {
  if (stageStatus === "CONCLUIDA") return "done";
  if (stageStatus === "A_CAMINHO") return "ahead";
  return "current";
}

/**
 * A etiqueta curta do percurso. A jornada tem rótulos completos ("Perfil de
 * Prioridades", "Curadoria em andamento") que servem à leitura detalhada e
 * pesam demais numa trilha de sete marcas no celular.
 */
export const WALK_LABELS: Record<JornadaStageId, string> = {
  CONSULTA_INICIAL: "Consulta",
  PERFIL_DE_PRIORIDADES: "Perfil",
  CURADORIA: "Curadoria",
  DOSSIE: "Relatório",
  REUNIAO: "Conversa",
  ESCOLHA: "Escolha",
  ACOMPANHAMENTO: "Acompanhamento",
};

// ---------------------------------------------------------------------------
// Compatibilidade por dimensão — quatro estados, nenhuma nota
// ---------------------------------------------------------------------------

/**
 * O que o paciente lê sobre cada dimensão. Os quatro estados do motor
 * traduzidos para a língua dele: `INFORMACAO_INSUFICIENTE` vira "ainda
 * precisamos confirmar" — lacuna nossa, nunca falha do profissional.
 */
export const COMPATIBILITY_LEVELS = ["PLENO", "PARCIAL", "A_CONFIRMAR", "NAO_ATENDE"] as const;
export type CompatibilityLevel = (typeof COMPATIBILITY_LEVELS)[number];

export const COMPATIBILITY_LABELS: Record<CompatibilityLevel, string> = {
  PLENO: "Atende plenamente",
  PARCIAL: "Atende parcialmente",
  A_CONFIRMAR: "Ainda precisamos confirmar",
  NAO_ATENDE: "Não atende",
};

/**
 * Quantos traços de dez a barra preenche. É representação visual, não
 * medida: os degraus são fixos por estado, e não existe valor intermediário
 * — barra contínua convidaria a comparar comprimento como quem compara nota.
 *
 * `A_CONFIRMAR` não preenche nada e recebe tratamento visual próprio na
 * tela: vazio por ausência de informação nunca deve parecer vazio por
 * demérito.
 */
export const COMPATIBILITY_FILL: Record<CompatibilityLevel, number> = {
  PLENO: 10,
  PARCIAL: 6,
  A_CONFIRMAR: 0,
  NAO_ATENDE: 1,
};

export function compatibilityLevelOf(assessment: string): CompatibilityLevel {
  switch (assessment) {
    case "ATENDE_PLENAMENTE":
      return "PLENO";
    case "ATENDE_PARCIALMENTE":
      return "PARCIAL";
    case "NAO_ATENDE":
      return "NAO_ATENDE";
    default:
      return "A_CONFIRMAR";
  }
}

/** As cinco dimensões que a pessoa lê, na ordem em que fazem sentido a ela. */
export const PATIENT_DIMENSIONS = [
  { criterion: "FORMACAO", label: "Formação" },
  { criterion: "EXPERIENCIA", label: "Experiência" },
  { criterion: "CONTINUIDADE_DO_CUIDADO", label: "Continuidade" },
  { criterion: "MODELO_DE_ATENDIMENTO", label: "Modelo de atendimento" },
  { criterion: "ACESSO", label: "Acesso" },
] as const;

export type PatientDimension = {
  criterion: string;
  label: string;
  level: CompatibilityLevel;
};

/** Onde a jornada está, em duas palavras — o eyebrow do hero. */
export const STAGE_EYEBROWS: Record<JornadaStageId, string> = {
  CONSULTA_INICIAL: "Sua jornada começa",
  PERFIL_DE_PRIORIDADES: "Construindo seu Perfil",
  CURADORIA: "Curadoria em andamento",
  DOSSIE: "Sua Curadoria está pronta",
  REUNIAO: "Vamos conversar",
  ESCOLHA: "Os caminhos encontrados",
  ACOMPANHAMENTO: "Seguimos com você",
};

// ---------------------------------------------------------------------------
// A fronteira de vocabulário — o que jamais chega à tela do paciente
// ---------------------------------------------------------------------------

/**
 * Usada por teste (e disponível a qualquer superfície) para varrer o que o
 * paciente nunca deve ler: nota, ranking, posição, cobertura, cálculo,
 * mecanismo. A lista é a fronteira entre os dois dashboards — o do Curador
 * trabalha com decisões e cruzamentos; o do paciente, com compreensão.
 */
export const PATIENT_FORBIDDEN_TERMS = [
  "score",
  "ranking",
  "nota",
  "pontuação",
  "pontos possíveis",
  "cobertura",
  "primeiro lugar",
  "melhor opção",
  "mais recomendado",
  "vencedor",
  "algoritmo",
  "motor",
  "cruzamento",
  "internalScore",
  "coveredWeight",
] as const;

export function violatesPatientVocabulary(text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of PATIENT_FORBIDDEN_TERMS) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  return null;
}
