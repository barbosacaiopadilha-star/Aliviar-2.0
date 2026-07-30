// Módulo curadoria (MISSÃO 002) — Curadoria Compartilhada. Substitui o ACE
// automático como mecanismo de decisão: aqui o Curador conduz e o sistema
// apenas registra, calcula e organiza (docs/FUNDAMENTOS_DO_METODO_ALIVIAR.md).
//
// Nenhum tipo deste módulo modela "melhor médico", ranking universal ou
// recomendação final — só compatibilidade contextualizada a um Perfil de
// Prioridades específico.

// ---------------------------------------------------------------------------
// As sete etapas do raciocínio — a mesma sequência em toda Curadoria
// ---------------------------------------------------------------------------

export const CURADORIA_STEPS = [
  "COMPREENDER",
  "ESTRUTURAR",
  "PRIORIZAR",
  "COMPARAR",
  "JUSTIFICAR",
  "APRESENTAR",
  "DECIDIR",
] as const;

export type CuradoriaStep = (typeof CURADORIA_STEPS)[number];

export const CURADORIA_STEP_LABELS: Record<CuradoriaStep, string> = {
  COMPREENDER: "Compreender",
  ESTRUTURAR: "Estruturar",
  PRIORIZAR: "Priorizar",
  COMPARAR: "Comparar",
  JUSTIFICAR: "Justificar",
  APRESENTAR: "Apresentar",
  DECIDIR: "Decidir",
};

export const CURADORIA_STEP_DESCRIPTIONS: Record<CuradoriaStep, string> = {
  COMPREENDER: "Ouvir a história inteira, sem organizar nada ainda.",
  ESTRUTURAR: "Separar o que é necessidade, o que é limite e o que é receio.",
  PRIORIZAR: "Registrar, com o paciente, quanto cada subcritério do Método importa neste caso.",
  COMPARAR: "Aplicar o Perfil validado aos profissionais já aprovados pela Aliviar.",
  JUSTIFICAR: "Escrever, em linguagem humana, por que cada análise resultou no que resultou.",
  APRESENTAR: "Escolher três caminhos legítimos e explicar o que diferencia cada um.",
  DECIDIR: "A escolha é do paciente, no tempo dele.",
};

// ---------------------------------------------------------------------------
// Critérios — vocabulário fechado, cada um mapeado a dado real do cadastro
// ---------------------------------------------------------------------------

export const PRIORITY_CRITERIA = [
  "EXPERIENCIA",
  "AREA_DE_ATUACAO",
  "DISPONIBILIDADE",
  "CONTINUIDADE",
  "ABORDAGEM_INICIAL",
  "LOCALIZACAO",
] as const;

export type PriorityCriterion = (typeof PRIORITY_CRITERIA)[number];

export const PRIORITY_CRITERION_LABELS: Record<PriorityCriterion, string> = {
  EXPERIENCIA: "Experiência",
  AREA_DE_ATUACAO: "Área de atuação",
  DISPONIBILIDADE: "Disponibilidade",
  CONTINUIDADE: "Acompanhamento contínuo",
  ABORDAGEM_INICIAL: "Forma do primeiro encontro",
  LOCALIZACAO: "Localização",
};

// Como cada critério é explicado ao paciente — nunca em jargão de sistema.
export const PRIORITY_CRITERION_QUESTIONS: Record<PriorityCriterion, string> = {
  EXPERIENCIA: "Quanto pesa, para você, o tempo de estrada do profissional?",
  AREA_DE_ATUACAO: "Quanto pesa que ele trabalhe exatamente com o que você precisa?",
  DISPONIBILIDADE: "Quanto pesa conseguir ser atendido logo?",
  CONTINUIDADE: "Quanto pesa ter alguém que acompanhe você ao longo do tempo?",
  ABORDAGEM_INICIAL: "Quanto pesa a forma como o primeiro encontro acontece?",
  LOCALIZACAO: "Quanto pesa a região onde o profissional atende?",
};

// Critérios que exigem um alvo declarado pelo paciente (não são monotônicos:
// "mais" não é automaticamente "melhor").
export const CRITERIA_REQUIRING_TARGET: readonly PriorityCriterion[] = [
  "AREA_DE_ATUACAO",
  "ABORDAGEM_INICIAL",
  "LOCALIZACAO",
];

export const COMPETENCY_DOMAINS = ["saude_emocional_mental", "saude_fisica", "nao_determinado"] as const;
export type CompetencyDomain = (typeof COMPETENCY_DOMAINS)[number];

export const INTAKE_APPROACHES = ["conexao_direta", "aprofundamento_previo", "avaliacao_inicial", "ambos"] as const;
export type IntakeApproach = (typeof INTAKE_APPROACHES)[number];

export const EXPERIENCE_LEVELS = ["geral", "experiente", "altamente_experiente"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const AVAILABILITY_WINDOWS = ["flexible", "limited", "unavailable_soon"] as const;
export type AvailabilityWindow = (typeof AVAILABILITY_WINDOWS)[number];

// ---------------------------------------------------------------------------
// Filtros obrigatórios e preferências
// ---------------------------------------------------------------------------

export const FILTER_NATURES = ["FILTRO_OBRIGATORIO", "PREFERENCIA"] as const;
export type FilterNature = (typeof FILTER_NATURES)[number];

export const MANDATORY_FILTER_KINDS = [
  "UF",
  "AREA_DE_ATUACAO",
  "CUIDADO_CONTINUO",
  "DISPONIBILIDADE_IMEDIATA",
] as const;

export type MandatoryFilterKind = (typeof MANDATORY_FILTER_KINDS)[number];

export const MANDATORY_FILTER_LABELS: Record<MandatoryFilterKind, string> = {
  UF: "Estado de atuação",
  AREA_DE_ATUACAO: "Área de atuação",
  CUIDADO_CONTINUO: "Oferece acompanhamento contínuo",
  DISPONIBILIDADE_IMEDIATA: "Disponibilidade imediata",
};

export type PriorityFilter = {
  id: string;
  priorityProfileId: string;
  nature: FilterNature;
  kind: string;
  value: string;
  note: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Perfil de Prioridades
// ---------------------------------------------------------------------------

/**
 * ARMAZENAMENTO LEGADO — ADR-042.
 *
 * `VALIDATED` continua na coluna por razão de dado histórico, e NÃO é mais
 * autoridade semântica. O conceito do domínio é o reconhecimento do Perfil
 * pela paciente: ver `reconhecimento-do-perfil.ts`, único lugar autorizado a
 * traduzir estes valores.
 */
export const PRIORITY_PROFILE_STATUSES = ["DRAFT", "VALIDATED", "SUPERSEDED"] as const;
export type PriorityProfileStatus = (typeof PRIORITY_PROFILE_STATUSES)[number];

export const PRIORITY_PROFILE_STATUS_LABELS: Record<PriorityProfileStatus, string> = {
  DRAFT: "Em construção",
  VALIDATED: "Perfil reconhecido pela paciente",
  SUPERSEDED: "Substituído",
};

// Cada peso carrega obrigatoriamente sua Evidência de Curadoria — o momento
// da Consulta Inicial que o originou. Peso sem evidência não existe.
export type PriorityWeight = {
  id: string;
  priorityProfileId: string;
  criterion: PriorityCriterion;
  weight: number;
  targetValue: string | null;
  evidence: string;
  createdAt: string;
};

export type PriorityProfile = {
  id: string;
  caseId: string;
  curatorId: string;
  curatorName: string | null;
  status: PriorityProfileStatus;
  patientHistory: string | null;
  validatedAt: string | null;
  validationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PriorityProfileDetail = PriorityProfile & {
  weights: PriorityWeight[];
  mandatoryFilters: PriorityFilter[];
  preferences: PriorityFilter[];
  totalWeight: number;
};

// ---------------------------------------------------------------------------
// Compatibilidade — dois níveis
// ---------------------------------------------------------------------------

// Nível externo. É o único que pode chegar ao paciente.
export const COMPATIBILITY_BANDS = ["MUITO_ALTA", "ALTA", "BOA", "MODERADA"] as const;
export type CompatibilityBand = (typeof COMPATIBILITY_BANDS)[number];

export const COMPATIBILITY_BAND_LABELS: Record<CompatibilityBand, string> = {
  MUITO_ALTA: "Compatibilidade muito alta",
  ALTA: "Compatibilidade alta",
  BOA: "Compatibilidade boa",
  MODERADA: "Compatibilidade moderada",
};

export type CriterionResult = {
  criterion: PriorityCriterion;
  weight: number;
  // Null = o cadastro do profissional não tem esse dado. Nunca 0 disfarçado
  // de "ruim" — ausência de informação é ausência, não nota baixa.
  alignment: number | null;
  contribution: number;
  explanation: string;
};

export type CompatibilityAnalysis = {
  id: string;
  caseId: string;
  priorityProfileId: string;
  professionalProfileId: string;
  professionalName: string;
  // Nível interno (0-100). Ferramenta do Curador — nunca chega ao paciente.
  internalScore: number;
  band: CompatibilityBand;
  criteriaWithoutData: number;
  criteria: CriterionResult[];
  computedAt: string;
};

// Dado real do cadastro do profissional, sem nada inferido. Null em qualquer
// campo significa "não registrado" e é tratado como lacuna explícita.
export type ProviderSnapshot = {
  professionalProfileId: string;
  displayName: string;
  status: string;
  experienceLevel: ExperienceLevel | null;
  intakeApproach: IntakeApproach | null;
  offersContinuousCare: boolean | null;
  availabilityWindow: AvailabilityWindow | null;
  crmUf: string | null;
  competencyDomains: CompetencyDomain[];
};

// ---------------------------------------------------------------------------
// Seleção e decisão
// ---------------------------------------------------------------------------

export const SELECTION_STATUSES = ["DRAFT", "DELIVERED"] as const;
export type SelectionStatus = (typeof SELECTION_STATUSES)[number];

export type SelectionOption = {
  id: string;
  curatedSelectionId: string;
  professionalProfileId: string;
  professionalName: string;
  // Ordem de apresentação, nunca colocação.
  position: number;
  // Histórico (M2, ADR-042): seleções novas não gravam banda. `null` é o
  // normal daqui em diante; valor presente é registro do motor aposentado.
  band: CompatibilityBand | null;
  rationale: string;
  tradeOff: string | null;
};

export type CuratedSelection = {
  id: string;
  caseId: string;
  priorityProfileId: string;
  selectedBy: string;
  selectedByName: string | null;
  compositionRationale: string;
  status: SelectionStatus;
  deliveredAt: string | null;
  createdAt: string;
  options: SelectionOption[];
};

export const DECISION_OUTCOMES = ["CHOSEN", "NONE_OF_THEM"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export type PatientDecision = {
  id: string;
  caseId: string;
  curatedSelectionId: string;
  chosenOptionId: string | null;
  outcome: DecisionOutcome;
  note: string | null;
  decidedAt: string;
};

export type CuradoriaActionResult = { success: true } | { success: false; error: string };
