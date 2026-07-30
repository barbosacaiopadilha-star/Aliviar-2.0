/**
 * JORNADA DO CURADOR — a projeção das nove fases em seis etapas de raciocínio.
 *
 * @metodo Fundamentos §5.2 — as etapas do raciocínio são o pensamento; as nove fases são o trabalho
 * @metodo Guided Experience §1 — a plataforma se organiza pela jornada mental de quem a usa
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho
 *
 * Por que existe: as nove fases do COS são a verdade operacional do Método e
 * continuam intactas — cada uma com seus critérios de entrada e saída, avaliados
 * pelo mesmo `conduct()`. Mas o Curador não pensa em nove momentos: ele pensa
 * "vou entender esta pessoa", "vou definir o que importa para ela", "ela precisa
 * reconhecer isso como dela". Duas fases que sempre acontecem no mesmo momento
 * do raciocínio são uma etapa só na cabeça dele — e virar duas na tela é o
 * software se impondo sobre o pensamento.
 *
 * O que este módulo NÃO faz: não muda `COS_PHASES`, não muda critério de saída,
 * não muda `conduct()`, não muda banco. É projeção pura e determinística sobre
 * o estado que o Motor já produziu. Remover este arquivo devolveria a plataforma
 * às nove telas sem perder uma regra sequer.
 *
 * Por que 6 e não nove — o teste aplicado a cada fusão foi: *as duas fases
 * exigem mudança de contexto, de responsabilidade, de decisão ou de objetivo?*
 *
 *   HISTORIA + CASO ....... fundidas. Mesma conversa, mesmo material, mesmo
 *                           objetivo ("entendi esta pessoa"). O que muda entre
 *                           elas é o grau de organização do mesmo texto.
 *   FILTROS + PRIORIDADES . fundidas. É UMA pergunta com dois lados: o que
 *                           elimina e o que pesa. A Invariante 24 (nada é filtro
 *                           E critério) só é pensável vendo os dois juntos —
 *                           separá-los criava o conflito que depois virava alerta.
 *   VALIDACAO ............. fundida em PRIORIZAR desde a ADR-042. O ato continua
 *                           sendo do paciente e continua irreversível — mas ele é
 *                           ESTADO do Perfil, não etapa da investigação do Curador.
 *                           Enquanto ela não reconhece, a etapa fica AGUARDANDO:
 *                           diz de quem depende sem cobrar quem não deve.
 *   RELATORIO + DEVOLUTIVA  SEPARADAS. Dias diferentes, donos diferentes:
 *                           escrever o parecer é do Curador, a decisão é do
 *                           paciente. Fundir esconderia a espera humana.
 *   ACOLHIMENTO ........... SEPARADA. Acontece ANTES da Consulta Inicial; entre
 *                           ela e a próxima etapa existe um evento do mundo real.
 */

import { COS_PHASE_DEFINITIONS } from "./phases";
import type {
  ConductionState,
  CosPhaseId,
  CuradoriaRecord,
  PhaseState,
  PhaseStatus,
} from "./types";

export const CURATOR_JOURNEY_STEPS = [
  "ACOLHER",
  "COMPARAR",
  "RELATORIO",
  "FINALIZAR",
] as const;

export type CuratorJourneyStepId = (typeof CURATOR_JOURNEY_STEPS)[number];

/**
 * A pergunta que o Curador está respondendo — o nome da etapa é o próprio
 * raciocínio, nunca o nome da entidade que ela grava.
 */
type StepDefinition = {
  id: CuratorJourneyStepId;
  label: string;
  /** O que o Curador consegue dizer quando esta etapa termina. */
  completionSentence: string;
  /** As fases canônicas do COS que esta etapa materializa. */
  phases: CosPhaseId[];
  /** Slug da rota. */
  slug: string;
};

export const CURATOR_JOURNEY_DEFINITIONS: Record<CuratorJourneyStepId, StepDefinition> = {
  ACOLHER: {
    id: "ACOLHER",
    label: "Acolhimento",
    completionSentence: "Entendi esta pessoa, e ela reconheceu a própria história.",
    phases: ["ACOLHIMENTO", "HISTORIA", "CASO"],
    slug: "acolhimento",
  },

  COMPARAR: {
    id: "COMPARAR",
    label: "Mesa de Curadoria",
    completionSentence: "Escolhi, como humano, os três caminhos legítimos.",
    phases: ["FILTROS", "PRIORIDADES", "VALIDACAO", "CURADORIA_TECNICA"],
    slug: "curadoria_tecnica",
  },
  RELATORIO: {
    id: "RELATORIO",
    label: "Relatório",
    completionSentence: "Escrevi o que cada opção oferece e o que cada uma custa.",
    phases: ["RELATORIO"],
    slug: "relatorio",
  },
  FINALIZAR: {
    id: "FINALIZAR",
    label: "Finalizar",
    completionSentence: "Apresentei as opções e registrei a decisão dela.",
    phases: ["DEVOLUTIVA"],
    slug: "finalizar",
  },
};

export const CURATOR_JOURNEY_ORDER: CuratorJourneyStepId[] = [...CURATOR_JOURNEY_STEPS];

/**
 * Toda rota antiga continua chegando ao lugar certo.
 *
 * A equipe já usa `/casos/:id/historia` e `/casos/:id/filtros` — mudar o
 * endereço sem levar junto quem já o conhece é trocar carga cognitiva de lugar,
 * não reduzi-la (INFORMATION_ARCHITECTURE §3, risco 1).
 */
const PHASE_TO_STEP: Record<CosPhaseId, CuratorJourneyStepId> = {
  ACOLHIMENTO: "ACOLHER",
  HISTORIA: "ACOLHER",
  CASO: "ACOLHER",
  FILTROS: "COMPARAR",
  PRIORIDADES: "COMPARAR",
  VALIDACAO: "COMPARAR",
  CURADORIA_TECNICA: "COMPARAR",
  RELATORIO: "RELATORIO",
  DEVOLUTIVA: "FINALIZAR",
};

export function stepOfPhase(phase: CosPhaseId): CuratorJourneyStepId {
  return PHASE_TO_STEP[phase];
}

/**
 * Slugs que a jornada já usou e que continuam existindo em links salvos,
 * e-mails e abas abertas. Removê-los seco transformaria um endereço conhecido
 * em 404 — o custo cairia sobre quem não fez nada de errado.
 */
const LEGACY_SLUGS: Record<string, CuratorJourneyStepId> = {
  criterios: "COMPARAR",
  validacao: "COMPARAR",
  // O Mapa deixou de ser etapa da navegação e passou a viver dentro da Mesa
  // (é lá que paciente e Curador definem juntos o que importa). O endereço
  // continua chegando — quem tem o link não encontra 404.
  "mapa-de-prioridades": "COMPARAR",
  compreender: "ACOLHER",
};

/** Resolve um slug de URL — novo ou herdado — para a etapa da jornada. */
export function resolveJourneyStep(slug: string): CuratorJourneyStepId | null {
  const normalized = slug.trim().toLowerCase();

  const legacy = LEGACY_SLUGS[normalized];
  if (legacy) return legacy;

  for (const step of CURATOR_JOURNEY_ORDER) {
    if (CURATOR_JOURNEY_DEFINITIONS[step].slug === normalized) return step;
  }

  // Slugs das nove fases continuam válidos, apontando para a etapa que as contém.
  const asPhase = normalized.toUpperCase() as CosPhaseId;
  return PHASE_TO_STEP[asPhase] ?? null;
}

// ---------------------------------------------------------------------------
// Estado de uma etapa
// ---------------------------------------------------------------------------

/**
 * O estado da etapa é o das fases que ela contém — derivado, nunca declarado
 * (UX_PRINCIPLES P4). A regra de composição é a mais conservadora possível:
 * a etapa só é concluída quando TODAS as suas fases estão concluídas, e
 * herda o estado mais restritivo das que ainda não estão.
 */
export type JourneyStepState = {
  id: CuratorJourneyStepId;
  label: string;
  order: number;
  status: PhaseStatus;
  /** Fases canônicas por trás — a auditoria continua falando a língua do Método. */
  phases: PhaseState[];
  /** O que esta etapa ainda espera, em linguagem humana. Vem dos critérios do Motor. */
  missing: string[];
  /** O que já ficou pronto dentro dela. Nunca inventado: é critério atendido. */
  settled: string[];
  /** Por que está bloqueada, quando está. */
  blockedReason: string | null;
  completionSentence: string;
  slug: string;
};

export type CuratorJourney = {
  steps: JourneyStepState[];
  currentStep: CuratorJourneyStepId;
  completedCount: number;
  totalCount: number;
};

function composeStatus(phases: PhaseState[]): PhaseStatus {
  if (phases.every((phase) => phase.status === "CONCLUIDA")) return "CONCLUIDA";

  const pending = phases.filter((phase) => phase.status !== "CONCLUIDA");

  // Esperar por alguém é o estado mais honesto que existe: se qualquer parte
  // da etapa depende de um ato do paciente, a etapa inteira está aguardando —
  // e o Curador não é cobrado por algo que não é dele.
  if (pending.some((phase) => phase.status === "AGUARDANDO")) return "AGUARDANDO";
  if (pending.some((phase) => phase.status === "EM_ANDAMENTO")) return "EM_ANDAMENTO";

  // Uma etapa cuja primeira fase já fechou está no meio do trabalho, não
  // esperando começar.
  if (phases.some((phase) => phase.status === "CONCLUIDA")) return "EM_ANDAMENTO";

  if (pending.some((phase) => phase.status === "DISPONIVEL")) return "DISPONIVEL";
  return "BLOQUEADA";
}

/**
 * Constrói a jornada de seis etapas a partir do estado já produzido pelo Motor.
 *
 * Recebe `state` pronto em vez de chamar `conduct()` internamente: assim fica
 * impossível esta camada produzir uma condução diferente da que o resto do
 * Portal enxerga.
 */
export function buildCuratorJourney(
  record: CuradoriaRecord,
  state: ConductionState,
): CuratorJourney {
  const byPhase = new Map(state.phases.map((phase) => [phase.phase, phase]));

  const steps: JourneyStepState[] = CURATOR_JOURNEY_ORDER.map((stepId, index) => {
    const definition = CURATOR_JOURNEY_DEFINITIONS[stepId];
    const phases = definition.phases.map((phase) => byPhase.get(phase)!);
    const status = composeStatus(phases);

    const missing = phases.flatMap((phase) => phase.missing);

    // "O que já sabemos": critérios de saída efetivamente atendidos. Sai do
    // mesmo lugar que "o que falta" — nunca de um texto escrito na tela.
    const settled = definition.phases.flatMap((phase) =>
      COS_PHASE_DEFINITIONS[phase].exitCriteria
        .filter((criterion) => criterion.isMet(record))
        .map((criterion) => criterion.description),
    );

    const blocked = phases.find((phase) => phase.status === "BLOQUEADA");

    return {
      id: stepId,
      label: definition.label,
      order: index + 1,
      status,
      phases,
      missing,
      settled,
      blockedReason: blocked ? blocked.reason : null,
      completionSentence: definition.completionSentence,
      slug: definition.slug,
    };
  });

  const currentStep = steps.find((step) => step.status !== "CONCLUIDA")?.id ?? steps[steps.length - 1]!.id;

  return {
    steps,
    currentStep,
    completedCount: steps.filter((step) => step.status === "CONCLUIDA").length,
    totalCount: steps.length,
  };
}

export function journeyStepHref(caseId: string, step: CuratorJourneyStepId): string {
  return `/coa/curadoria/casos/${caseId}/${CURATOR_JOURNEY_DEFINITIONS[step].slug}`;
}

/**
 * Rótulo do botão principal de cada etapa — nomeia o efeito, nunca "Continuar"
 * (UX_PRINCIPLES P3).
 */
export const JOURNEY_ACTION_LABELS: Record<CuratorJourneyStepId, string> = {
  ACOLHER: "Registrar o que entendi",
  COMPARAR: "Abrir a Mesa de Curadoria",
  RELATORIO: "Escrever o Relatório",
  FINALIZAR: "Registrar a decisão dela",
};
