/**
 * Curator Operating System (COS) — tipos do registro de uma Curadoria.
 *
 * A Memória da Curadoria: tudo o que aconteceu, em uma estrutura única, de
 * onde qualquer decisão pode ser reconstruída (Engine §5.6, teste de
 * reconstrução). Nenhuma fase guarda estado em lugar próprio — existe um só
 * registro, e o Motor de Condução o lê para responder onde o Curador está.
 *
 * Nada aqui inventa conceito: cada campo corresponde a uma entidade ou
 * atributo já definido na Ontologia.
 */

import type { CompatibilityBand, CuradoriaStep, PriorityCriterion } from "../types";

// ---------------------------------------------------------------------------
// As nove fases operacionais
// ---------------------------------------------------------------------------

export const COS_PHASES = [
  "ACOLHIMENTO",
  "HISTORIA",
  "CASO",
  "FILTROS",
  "PRIORIDADES",
  "VALIDACAO",
  "CURADORIA_TECNICA",
  "RELATORIO",
  "DEVOLUTIVA",
] as const;

export type CosPhaseId = (typeof COS_PHASES)[number];

export const COS_PHASE_LABELS: Record<CosPhaseId, string> = {
  ACOLHIMENTO: "Acolhimento",
  HISTORIA: "História",
  CASO: "Caso",
  FILTROS: "Filtros",
  PRIORIDADES: "Perfil de Prioridades",
  VALIDACAO: "Validação",
  CURADORIA_TECNICA: "Curadoria Técnica",
  RELATORIO: "Relatório",
  DEVOLUTIVA: "Devolutiva",
};

// ---------------------------------------------------------------------------
// Registro de cada fase
// ---------------------------------------------------------------------------

export type AcolhimentoRecord = {
  /** O Curador leu o que já se sabe antes da conversa. Nunca iniciar sem contexto. */
  contextReviewed: boolean;
  documentsReviewed: boolean;
  meetingScheduledAt: string | null;
  knownFacts: string[];
  openPendencies: string[];
};

export type HistoriaRecord = {
  /** A narrativa como o Curador a compreendeu — nunca um questionário. */
  narrative: string | null;
  /** O que o paciente disse que motivou a busca, nas palavras dele. */
  motivation: string | null;
  /** Momento em que a devolução ("deixa eu ver se entendi") foi feita. */
  understandingConfirmedAt: string | null;
  registeredAt: string | null;
};

export type CasoRecord = {
  diagnosis: string | null;
  hypothesis: string | null;
  exams: string[];
  treatments: string[];
  clinicalContext: string | null;
  limitations: string[];
};

export type FiltroRecord = {
  id: string;
  kind: string;
  label: string;
  value: string;
  /** Por que este requisito é inegociável — sempre nas palavras do paciente. */
  reason: string;
};

export type PesoRecord = {
  criterion: PriorityCriterion;
  weight: number;
  targetValue: string | null;
  /** Evidência de Curadoria — obrigatória. Peso sem evidência não existe. */
  evidence: string;
  registeredAt: string;
};

export type PrioridadesRecord = {
  /**
   * Subcritérios do catálogo ativo ainda sem classificação. Zero significa
   * Mapa de Prioridades completo — e é o ÚNICO gate da fase (ADR-042).
   *
   * Vem de `priorityMapCompletion`, o contrato do domínio. As fases não
   * recalculam completude: duplicar a regra é como ela volta a divergir.
   */
  mapaPendentes: number;
  /** LEGADO — a distribuição de 100 pontos. Nenhuma fase depende dela. */
  weights: PesoRecord[];
  observations: string[];
  /** As mesmas preferências, com id — para poderem ser retiradas pela tela. */
  preferencias: { id: string; value: string }[];
  /** Histórico de alterações — o Curador consegue ver como a conversa evoluiu. */
  history: { at: string; description: string }[];
};

export type ValidacaoRecord = {
  validatedAt: string;
  /** Como o paciente confirmou que o Perfil é dele. Registro do ato, não um aceite. */
  validationNote: string;
  /** O que o paciente corrigiu durante a leitura em voz alta, se corrigiu. */
  correctionsMade: string[];
};

export type AnaliseRecord = {
  professionalId: string;
  professionalName: string;
  internalScore: number;
  band: CompatibilityBand;
  coveredWeight: number;
  criteria: {
    criterion: PriorityCriterion;
    weight: number;
    alignment: number | null;
    contribution: number;
    explanation: string;
  }[];
  /** Observação livre do Curador sobre este profissional neste caso. */
  curatorNote: string | null;
};

export type ExclusaoRecord = {
  professionalId: string;
  professionalName: string;
  failures: string[];
};

export type CuradoriaTecnicaRecord = {
  computedAt: string | null;
  analyses: AnaliseRecord[];
  excluded: ExclusaoRecord[];
  /** Exatamente três, escolhidos pelo Curador. Nunca pelo sistema. */
  selectedProfessionalIds: string[];
  selectedBy: string | null;
  selectedAt: string | null;
  /** A seleção gravada — é o que a entrega ao paciente endereça. */
  curatedSelectionId: string | null;
};

export type OpcaoRelatorio = {
  professionalId: string;
  position: number;
  justification: string;
  /** Como esta opção conversa com os pesos que o paciente definiu. */
  relationToWeights: string;
  favorablePoints: string[];
  attentionPoints: string[];
  suggestedQuestions: string[];
  curatorObservations: string | null;
};

export type RelatorioRecord = {
  options: OpcaoRelatorio[];
  compositionRationale: string | null;
  emittedAt: string | null;
  /** Quando o paciente passou a ter acesso. Depois disso o documento não muda. */
  deliveredAt: string | null;
};

export type DevolutivaRecord = {
  presentedAt: string | null;
  patientQuestions: string[];
  observations: string[];
  decision: {
    outcome: "CHOSEN" | "NONE_OF_THEM";
    chosenProfessionalId: string | null;
    justification: string | null;
    decidedAt: string;
  } | null;
  nextSteps: string[];
};

// ---------------------------------------------------------------------------
// A Memória completa
// ---------------------------------------------------------------------------

export type CuradoriaRecord = {
  caseId: string;
  patientName: string;
  patientFirstName: string;
  curatorName: string;
  openedAt: string;
  promisedReturn: string | null;
  acolhimento: AcolhimentoRecord;
  historia: HistoriaRecord;
  caso: CasoRecord;
  filtros: FiltroRecord[];
  prioridades: PrioridadesRecord;
  /** ID do Perfil de Prioridades ativo — necessário para persistir validação. */
  priorityProfileId: string | null;
  validacao: ValidacaoRecord | null;
  curadoriaTecnica: CuradoriaTecnicaRecord;
  relatorio: RelatorioRecord;
  devolutiva: DevolutivaRecord;
};

// ---------------------------------------------------------------------------
// Saída do Motor de Condução
// ---------------------------------------------------------------------------

export type PhaseStatus = "CONCLUIDA" | "EM_ANDAMENTO" | "DISPONIVEL" | "AGUARDANDO" | "BLOQUEADA";

export type PhaseState = {
  phase: CosPhaseId;
  status: PhaseStatus;
  /** Por que está neste estado — sempre em linguagem de pessoa. */
  reason: string;
  /** O que falta para concluir esta fase. Vazio quando concluída. */
  missing: string[];
};

export type ConductionInconsistency = {
  /** Código do catálogo do Motor (Engine §4.4). */
  code: string;
  phase: CosPhaseId;
  description: string;
};

export type ConductionAlert = {
  /** Código de exceção ou conflito do Motor (Engine §4.5, §9). */
  code: string;
  phase: CosPhaseId;
  title: string;
  detail: string;
  severity: "atencao" | "bloqueio";
};

export type ConductionPendency = {
  owner: "CURADOR" | "PACIENTE" | "EQUIPE";
  phase: CosPhaseId;
  description: string;
};

export type ConductionState = {
  /** Onde estou? */
  currentPhase: CosPhaseId;
  currentReasoningStep: CuradoriaStep;
  /** O que já foi concluído? */
  completedPhases: CosPhaseId[];
  phases: PhaseState[];
  /** Qual é o próximo passo? — sempre exatamente um. */
  nextStep: {
    phase: CosPhaseId;
    label: string;
    description: string;
    /** `acao` = é com o Curador. `aguardando` = a bola está com outra pessoa. */
    kind: "acao" | "aguardando";
  };
  /** O que falta? */
  missing: string[];
  /** Existe alguma inconsistência? */
  inconsistencies: ConductionInconsistency[];
  /** Existe alguma pendência? */
  pendencies: ConductionPendency[];
  alerts: ConductionAlert[];
};
