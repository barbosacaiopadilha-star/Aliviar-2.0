// BRIEFING DA CURADORIA — tipos.
//
// @metodo ACE_FOUNDATION §4 — o ACE organiza para o Curador enxergar melhor,
//   nunca para que ele pense menos
// @metodo ACE_DATA_CLASSIFICATION §1 — toda informação carrega sua classe
//
// Esta camada NÃO toca o domínio do Case, o sistema de pesos nem
// computeCompatibility(). Ela acrescenta contexto e nada mais.

/**
 * Classe da informação (ACE_DATA_CLASSIFICATION §1). Determina como o dado
 * é exibido e se pode fundamentar uma sugestão. Fato, preferência e
 * interpretação NUNCA se misturam na apresentação.
 */
export const DATA_CLASSES = ["FATO", "PREFERENCIA", "INTERPRETACAO", "OPERACIONAL", "LACUNA"] as const;
export type DataClass = (typeof DATA_CLASSES)[number];

/** Origem obrigatória — informação sem origem não é exibida (P5). */
export const ORIGINS = ["PACIENTE", "MEDICO", "CURADOR", "SISTEMA", "FONTE_PUBLICA"] as const;
export type Origin = (typeof ORIGINS)[number];

export const ORIGIN_LABELS: Record<Origin, string> = {
  PACIENTE: "Paciente informou",
  MEDICO: "Médico declarou",
  CURADOR: "Curador observou",
  SISTEMA: "Sistema registrou",
  FONTE_PUBLICA: "Fonte pública verificada",
};

// ---------------------------------------------------------------------------
// BLOCO 1 — Paciente (as 5 perguntas aprovadas em ALIGNMENT_PROFILE §1)
// ---------------------------------------------------------------------------

export const PATIENT_QUESTIONS = ["PA1", "PA2", "PA3", "PA4", "PA5"] as const;
export type PatientQuestionId = (typeof PATIENT_QUESTIONS)[number];

export const PATIENT_QUESTION_TEXT: Record<PatientQuestionId, string> = {
  PA1: "Quando a Curadoria ficar pronta, o que ajuda mais você a decidir?",
  PA2: "Nas decisões sobre seu tratamento, você prefere que o médico recomende o caminho, ou prefere decidir junto com ele?",
  PA3: "Há algo de um atendimento anterior que você não quer que se repita?",
  PA4: "Alguém mais participa dessa decisão com você?",
  PA5: "Tem alguma questão prática que pode dificultar você ir às consultas?",
};

/** Opções fechadas. `PREFIRO_NAO_DIZER` existe em todas — nenhuma é obrigatória. */
export const PATIENT_OPTIONS = {
  PA1: ["LER_SOZINHO", "CONVERSAR", "AMBOS", "PREFIRO_NAO_DIZER"],
  PA2: ["PREFIRO_RECOMENDACAO", "DECIDIR_JUNTO", "DEPENDE", "PREFIRO_NAO_DIZER"],
  PA3: ["TEM_ALGO", "NAO_TEM", "PREFIRO_NAO_DIZER"],
  PA4: ["SO_EU", "FAMILIA", "RESPONSAVEL_LEGAL", "PREFIRO_NAO_DIZER"],
  PA5: ["HORARIO_TRABALHO", "DESLOCAMENTO", "CUIDAR_DE_ALGUEM", "NENHUMA", "PREFIRO_NAO_DIZER"],
} as const satisfies Record<PatientQuestionId, readonly string[]>;

export type PatientOption<Q extends PatientQuestionId> = (typeof PATIENT_OPTIONS)[Q][number];

export const PATIENT_OPTION_LABELS: Record<string, string> = {
  LER_SOZINHO: "Ler com calma, sozinho",
  CONVERSAR: "Conversar com alguém explicando",
  AMBOS: "Os dois",
  PREFIRO_RECOMENDACAO: "Prefiro que o médico recomende",
  DECIDIR_JUNTO: "Prefiro decidir junto com ele",
  DEPENDE: "Depende do caso",
  TEM_ALGO: "Sim, há algo",
  NAO_TEM: "Não",
  SO_EU: "Só eu",
  FAMILIA: "Alguém da família",
  RESPONSAVEL_LEGAL: "Um responsável legal",
  HORARIO_TRABALHO: "Horário de trabalho",
  DESLOCAMENTO: "Deslocamento",
  CUIDAR_DE_ALGUEM: "Cuidar de outra pessoa",
  NENHUMA: "Nenhuma",
  PREFIRO_NAO_DIZER: "Prefiro não dizer",
};

export type PatientAlignmentAnswer = {
  questionId: PatientQuestionId;
  option: string;
  /**
   * A fala preservada — Evidência de Curadoria (P4). Um resumo que vira
   * rótulo é proibido (P10): guarda-se o que a pessoa disse.
   */
  verbatim: string | null;
  answeredAt: string;
  /** Sempre PREFERENCIA: é o que a pessoa declarou, não verdade sobre o mundo. */
  dataClass: Extract<DataClass, "PREFERENCIA">;
  origin: Extract<Origin, "PACIENTE">;
};

// ---------------------------------------------------------------------------
// BLOCO 2 — Médico (ALIGNMENT_PROFILE §2)
// ---------------------------------------------------------------------------

export const PROFESSIONAL_QUESTIONS = ["ME1", "ME2", "ME3", "ME4", "ME5"] as const;
export type ProfessionalQuestionId = (typeof PROFESSIONAL_QUESTIONS)[number];

export const PROFESSIONAL_QUESTION_TEXT: Record<ProfessionalQuestionId, string> = {
  ME1: "Quando você explica um diagnóstico ou um plano, como costuma fazer?",
  ME2: "Como funciona o acompanhamento entre as consultas?",
  ME3: "Que tipos de caso você prefere encaminhar a outro profissional?",
  ME4: "Quando a família participa da decisão, como você costuma conduzir?",
  ME5: "Há algo sobre seu jeito de atender que você gostaria que o paciente soubesse antes da primeira consulta?",
};

export const PROFESSIONAL_OPTIONS = {
  ME1: ["CONVERSO_E_RESPONDO", "TAMBEM_POR_ESCRITO", "MOSTRO_EXAMES", "VARIA"],
  ME2: ["CANAL_DIRETO", "APENAS_CONSULTAS", "EQUIPE_RESPONDE", "VARIA"],
  ME4: ["RECEBO_JUNTOS", "PRIMEIRO_PACIENTE", "VARIA"],
} as const;

export const PROFESSIONAL_OPTION_LABELS: Record<string, string> = {
  CONVERSO_E_RESPONDO: "Converso e respondo dúvidas",
  TAMBEM_POR_ESCRITO: "Também entrego por escrito",
  MOSTRO_EXAMES: "Mostro exames e desenho",
  VARIA: "Varia conforme a pessoa",
  CANAL_DIRETO: "Tenho canal direto entre consultas",
  APENAS_CONSULTAS: "O contato acontece nas consultas",
  EQUIPE_RESPONDE: "Minha equipe responde",
  RECEBO_JUNTOS: "Recebo todos juntos",
  PRIMEIRO_PACIENTE: "Converso primeiro com o paciente",
};

export type ProfessionalAlignmentAnswer = {
  questionId: ProfessionalQuestionId;
  /** Opção fechada (ME1/ME2/ME4) ou null quando a resposta é texto. */
  option: string | null;
  /** Texto declarado pelo próprio médico (ME3/ME5). */
  declaredText: string | null;
  declaredAt: string;
  /** Sempre FATO declarado — com direito de correção pelo próprio médico (P8). */
  dataClass: Extract<DataClass, "FATO">;
  origin: Extract<Origin, "MEDICO">;
};

// ---------------------------------------------------------------------------
// BLOCO 3 — Curador (ALIGNMENT_PROFILE §3)
// ---------------------------------------------------------------------------

export const OBSERVATION_KINDS = ["CU1", "CU2", "CU3", "CU4", "CU5"] as const;
export type ObservationKind = (typeof OBSERVATION_KINDS)[number];

export const OBSERVATION_KIND_LABELS: Record<ObservationKind, string> = {
  CU1: "O que percebi nesta conversa",
  CU2: "O que já expliquei, e a reação",
  CU3: "O que precisa ser abordado antes da decisão",
  CU4: "Discordo de uma observação do sistema",
  CU5: "Ressalva sobre uma das opções",
};

/**
 * Observação do Curador — SEMPRE do Case, nunca da pessoa (P11).
 *
 * Não existe campo que ligue a observação ao paciente ou ao profissional
 * como sujeito permanente: o vínculo é com o Case, e o Case termina.
 */
export type CuratorObservation = {
  id: string;
  caseId: string;
  kind: ObservationKind;
  /** Sobre situação, nunca sobre essência (P10). */
  note: string;
  authorId: string;
  authorName: string;
  observedAt: string;
  dataClass: Extract<DataClass, "INTERPRETACAO">;
  origin: Extract<Origin, "CURADOR">;
};

// ---------------------------------------------------------------------------
// Briefing consolidado
// ---------------------------------------------------------------------------

/** Uma ponta de evidência de uma sugestão — quem disse o quê, e quando. */
export type Evidence = {
  origin: Origin;
  dataClass: DataClass;
  /** O conteúdo em linguagem humana — a fala ou a declaração. */
  statement: string;
  at: string | null;
};

/**
 * Sugestão de apresentação — SEMPRE com as duas pontas visíveis
 * (ACE_DATA_CLASSIFICATION §3.2) e com justificativa legível (P6).
 *
 * Nunca recomenda profissional. Nunca ordena. Nunca pontua.
 */
export type BriefingSuggestion = {
  id: string;
  kind: "ALINHAMENTO" | "ATENCAO" | "LACUNA";
  /** O que fazer na apresentação — em linguagem humana. */
  suggestion: string;
  /** Por que isto apareceu (P6). Nunca "o algoritmo calculou". */
  because: string;
  /** As pontas. ALINHAMENTO e ATENCAO exigem 2; LACUNA pode ter 1. */
  evidence: Evidence[];
};

export type CuradoriaBriefingData = {
  caseId: string;
  patientFirstName: string;
  patientAnswers: PatientAlignmentAnswer[];
  /** Respostas dos profissionais em avaliação, por id de perfil. */
  professionalAnswers: Map<string, ProfessionalAlignmentAnswer[]>;
  professionalNames: Map<string, string>;
  observations: CuratorObservation[];
  suggestions: BriefingSuggestion[];
};
