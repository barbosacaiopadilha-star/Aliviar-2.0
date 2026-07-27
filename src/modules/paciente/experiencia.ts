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
  CRITERION_LABELS,
  PATIENT_CRITERIA,
  TECHNICAL_CRITERIA,
  type CruzamentoCriterion,
} from "@/modules/curadoria/cruzamento";
import type { JornadaStageId } from "@/modules/curadoria/jornada";

// ---------------------------------------------------------------------------
// O Perfil, como importância — nunca como cálculo
// ---------------------------------------------------------------------------

/**
 * O peso vira palavra. Os cortes são relativos ao orçamento de 100 do
 * cruzamento: metade ou mais é "muito importante"; um quinto ou mais,
 * "importante"; o resto do que foi distribuído, "considerado". O número em si
 * nunca chega à tela do paciente.
 */
export function importanceLabel(weight: number): "Muito importante" | "Importante" | "Considerado" | null {
  if (weight >= 40) return "Muito importante";
  if (weight >= 20) return "Importante";
  if (weight > 0) return "Considerado";
  return null;
}

export type PerfilItem = {
  criterion: CruzamentoCriterion;
  label: string;
  importance: NonNullable<ReturnType<typeof importanceLabel>> | null;
};

export type PerfilView = {
  tecnicas: PerfilItem[];
  modeloDeCuidado: PerfilItem[];
  /** 0–100: quanto do Perfil já foi construído (critérios definidos + validação). */
  progress: number;
  validated: boolean;
  /** A frase do topo da seção, no estado atual. */
  headline: string;
};

/**
 * O progresso é de construção, nunca de qualidade: seis critérios a definir
 * e uma validação a acontecer — sete passos de igual tamanho. 100% significa
 * "o Perfil é seu e você o reconheceu", nada além.
 */
export function buildPerfilView(
  weights: Partial<Record<CruzamentoCriterion, number>>,
  validated: boolean,
): PerfilView {
  const item = (criterion: CruzamentoCriterion): PerfilItem => ({
    criterion,
    label: CRITERION_LABELS[criterion],
    importance: importanceLabel(weights[criterion] ?? 0),
  });

  const defined = [...TECHNICAL_CRITERIA, ...PATIENT_CRITERIA].filter(
    (criterion) => (weights[criterion] ?? 0) > 0,
  ).length;
  const steps = defined + (validated ? 1 : 0);
  const progress = Math.round((steps / 7) * 100);

  return {
    tecnicas: TECHNICAL_CRITERIA.map(item),
    modeloDeCuidado: PATIENT_CRITERIA.map(item),
    progress,
    validated,
    headline: validated
      ? "Este Perfil é seu — você o reconheceu, e é ele que guia a Curadoria."
      : defined > 0
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
