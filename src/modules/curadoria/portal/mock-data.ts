/**
 * Dados mockados do Portal do Curador (MISSÃO 100).
 *
 * Nenhuma integração com banco, autenticação ou serviço externo — a experiência
 * é construída primeiro. Todo dado aqui respeita a Ontologia: nenhum caso
 * mockado viola um invariante (nenhum peso sem evidência, nenhuma soma
 * diferente de 100 em Perfil validado, nenhuma seleção sem autor humano).
 *
 * Os casos foram desenhados para cobrir as sete etapas do raciocínio e as
 * exceções mais importantes do Motor — inclusive as desconfortáveis (E-02:
 * menos de três elegíveis; C-01: empate). Um portal que só mostra o caminho
 * feliz não prepara o Curador para o trabalho real.
 */

import type { CompatibilityBand, CuradoriaStep, PriorityCriterion } from "../types";

export type PortalCurator = {
  id: string;
  displayName: string;
  firstName: string;
};

export const CURRENT_CURATOR: PortalCurator = {
  id: "cur-001",
  displayName: "Helena Vasconcelos",
  firstName: "Helena",
};

/** Uma pendência é algo que espera uma ação de alguém — sempre com dono nomeado. */
export type PendencyOwner = "CURADOR" | "PACIENTE" | "EQUIPE";

export type Pendency = {
  id: string;
  owner: PendencyOwner;
  description: string;
  /** Quando a pendência é do paciente, o Curador não cobra — acompanha. */
  since: string;
};

/**
 * Alerta nasce de uma exceção nomeada do Motor (Engine §9). Nunca de uma
 * heurística de produtividade — não existe alerta de "caso parado há X dias"
 * que pressione o Curador.
 */
export type CaseAlert = {
  code: string;
  title: string;
  detail: string;
  severity: "atencao" | "bloqueio";
};

export type PortalCase = {
  id: string;
  patientName: string;
  patientFirstName: string;
  /** Em que etapa das sete o caso está agora. */
  step: CuradoriaStep;
  /** O que aconteceu por último, em linguagem de pessoa. */
  situation: string;
  /** A próxima ação — sempre exatamente uma, sempre do Curador ou de ninguém. */
  nextAction: {
    label: string;
    href: string;
    /** `aguardando` = a bola não está com o Curador. Ele acompanha, não age. */
    kind: "acao" | "aguardando";
  };
  pendencies: Pendency[];
  alerts: CaseAlert[];
  /** Prazo combinado com o paciente. O Motor avisa antes de vencer (E-12). */
  promisedReturn: string | null;
  lastActivityAt: string;
  openedAt: string;
};

export type PriorityWeightMock = {
  criterion: PriorityCriterion;
  weight: number;
  targetValue: string | null;
  /** Evidência de Curadoria — a fala que originou este peso. */
  evidence: string;
};

export type PriorityProfileMock = {
  caseId: string;
  status: "Rascunho" | "Em construção" | "Validado" | "Congelado";
  history: string;
  weights: PriorityWeightMock[];
  mandatoryFilters: { kind: string; label: string; value: string }[];
  observations: string[];
  validatedAt: string | null;
  validationNote: string | null;
};

export type CompatibilityMock = {
  caseId: string;
  professionalName: string;
  professionalId: string;
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
};

export type ActivityEvent = {
  id: string;
  /** Vocabulário de eventos do Motor (Engine §7) — nunca um verbo inventado. */
  event: string;
  caseId: string;
  patientFirstName: string;
  description: string;
  at: string;
  actor: string;
};

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

export const MOCK_CASES: PortalCase[] = [
  {
    id: "caso-2041",
    patientName: "Marina Alencar",
    patientFirstName: "Marina",
    step: "PRIORIZAR",
    situation: "Conversa concluída. Faltam 15 pontos para fechar a distribuição.",
    nextAction: {
      label: "Continuar o Perfil de Prioridades",
      href: "/portal-curador/casos/caso-2041",
      kind: "acao",
    },
    pendencies: [
      {
        id: "pend-1",
        owner: "CURADOR",
        description: "Distribuição em 85 de 100 pontos",
        since: "2026-07-22T14:30:00-03:00",
      },
    ],
    alerts: [],
    promisedReturn: "2026-07-25",
    lastActivityAt: "2026-07-22T14:30:00-03:00",
    openedAt: "2026-07-20T09:00:00-03:00",
  },
  {
    id: "caso-2038",
    patientName: "Joaquim Ribeiro",
    patientFirstName: "Joaquim",
    step: "COMPARAR",
    situation: "Perfil validado por Joaquim ontem. Comparação pronta para começar.",
    nextAction: {
      label: "Comparar profissionais",
      href: "/portal-curador/casos/caso-2038",
      kind: "acao",
    },
    pendencies: [],
    alerts: [],
    promisedReturn: "2026-07-24",
    lastActivityAt: "2026-07-22T17:05:00-03:00",
    openedAt: "2026-07-15T11:20:00-03:00",
  },
  {
    id: "caso-2033",
    patientName: "Cecília Prado",
    patientFirstName: "Cecília",
    step: "APRESENTAR",
    situation: "Três opções selecionadas e justificadas. Relatório pronto para revisão final.",
    nextAction: {
      label: "Revisar o Relatório",
      href: "/portal-curador/casos/caso-2033",
      kind: "acao",
    },
    pendencies: [],
    alerts: [
      {
        code: "C-01",
        title: "Duas opções equivalentes",
        detail:
          "Dois profissionais ficaram a menos de 3 pontos de diferença sob os critérios de Cecília. O Motor não desempata — a escolha da composição é sua.",
        severity: "atencao",
      },
    ],
    promisedReturn: "2026-07-23",
    lastActivityAt: "2026-07-23T08:40:00-03:00",
    openedAt: "2026-07-10T15:00:00-03:00",
  },
  {
    id: "caso-2029",
    patientName: "Antônio Salles",
    patientFirstName: "Antônio",
    step: "COMPARAR",
    situation: "As restrições de Antônio deixaram apenas dois profissionais elegíveis.",
    nextAction: {
      label: "Rever as restrições com Antônio",
      href: "/portal-curador/casos/caso-2029",
      kind: "acao",
    },
    pendencies: [],
    alerts: [
      {
        code: "E-02",
        title: "Menos de três opções elegíveis",
        detail:
          "Dois profissionais atendem a todas as restrições. A Curadoria apresenta sempre três — nenhuma restrição é afrouxada sem conversar com ele.",
        severity: "bloqueio",
      },
    ],
    promisedReturn: "2026-07-26",
    lastActivityAt: "2026-07-21T10:15:00-03:00",
    openedAt: "2026-07-18T08:30:00-03:00",
  },
  {
    id: "caso-2024",
    patientName: "Rosa Etsuko Nakamura",
    patientFirstName: "Rosa",
    step: "DECIDIR",
    situation: "Relatório entregue pessoalmente na terça. Rosa está pensando.",
    nextAction: {
      label: "Acompanhar — sem cobrar",
      href: "/portal-curador/casos/caso-2024",
      kind: "aguardando",
    },
    pendencies: [
      {
        id: "pend-2",
        owner: "PACIENTE",
        description: "Decisão entre as três opções",
        since: "2026-07-21T16:00:00-03:00",
      },
    ],
    alerts: [],
    promisedReturn: null,
    lastActivityAt: "2026-07-21T16:00:00-03:00",
    openedAt: "2026-07-02T13:45:00-03:00",
  },
  {
    id: "caso-2019",
    patientName: "Théo Marques",
    patientFirstName: "Théo",
    step: "COMPREENDER",
    situation: "Consulta Inicial agendada para amanhã às 10h.",
    nextAction: {
      label: "Preparar a Consulta Inicial",
      href: "/portal-curador/casos/caso-2019",
      kind: "acao",
    },
    pendencies: [],
    alerts: [],
    promisedReturn: null,
    lastActivityAt: "2026-07-22T09:00:00-03:00",
    openedAt: "2026-07-22T09:00:00-03:00",
  },
];

// ---------------------------------------------------------------------------
// Perfis de Prioridades
// ---------------------------------------------------------------------------

export const MOCK_PRIORITY_PROFILES: PriorityProfileMock[] = [
  {
    caseId: "caso-2041",
    status: "Em construção",
    history:
      "Marina acompanha o pai, 78 anos, depois de uma queda em casa. Ela mora em outra cidade e trabalha em escala fixa. O que mais a angustia não é o diagnóstico — é imaginar o pai sendo atendido por alguém diferente a cada consulta.",
    weights: [
      {
        criterion: "CONTINUIDADE",
        weight: 40,
        targetValue: null,
        evidence: "\"Eu não quero que ele tenha que contar a história dele de novo toda vez.\"",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 30,
        targetValue: null,
        evidence: "\"Com a idade dele, eu queria alguém que já tivesse visto muito caso parecido.\"",
      },
      {
        criterion: "LOCALIZACAO",
        weight: 15,
        targetValue: "SP",
        evidence: "\"Se for muito longe eu não consigo ir junto, e ele não vai sozinho.\"",
      },
    ],
    mandatoryFilters: [
      { kind: "UF", label: "Estado de atuação", value: "SP" },
      { kind: "CUIDADO_CONTINUO", label: "Oferece acompanhamento contínuo", value: "true" },
    ],
    observations: [
      "Prefere consultas pela manhã — o pai fica mais disposto.",
      "Marina participa das consultas; considera isso inegociável.",
    ],
    validatedAt: null,
    validationNote: null,
  },
  {
    caseId: "caso-2038",
    status: "Validado",
    history:
      "Joaquim, 54 anos, adiou procurar ajuda por quase um ano. Trabalha por conta própria e não pode parar. Chegou dizendo que já tinha desistido de encontrar alguém que 'não o tratasse como número'.",
    weights: [
      {
        criterion: "DISPONIBILIDADE",
        weight: 35,
        targetValue: null,
        evidence: "\"Se demorar um mês pra marcar, eu desisto de novo. Eu me conheço.\"",
      },
      {
        criterion: "ABORDAGEM_INICIAL",
        weight: 30,
        targetValue: "avaliacao_inicial",
        evidence: "\"Queria começar entendendo direito o que eu tenho, sem pressa de já tratar.\"",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 20,
        targetValue: null,
        evidence: "\"Experiência conta, mas não é o que mais pesa pra mim.\"",
      },
      {
        criterion: "AREA_DE_ATUACAO",
        weight: 15,
        targetValue: "saude_emocional_mental",
        evidence: "\"Precisa ser alguém que trabalhe com isso mesmo, não alguém que atende de tudo.\"",
      },
    ],
    mandatoryFilters: [{ kind: "UF", label: "Estado de atuação", value: "SP" }],
    observations: ["Prefere atendimento no fim do dia, depois das 18h."],
    validatedAt: "2026-07-22T17:05:00-03:00",
    validationNote:
      "Li os quatro pesos em voz alta na ordem. Joaquim corrigiu experiência de 30 para 20 e disse: 'é isso, agora tá a minha cara'.",
  },
];

// ---------------------------------------------------------------------------
// Compatibilidades — nível interno, exclusivo do Curador
// ---------------------------------------------------------------------------

export const MOCK_COMPATIBILITIES: CompatibilityMock[] = [
  {
    caseId: "caso-2038",
    professionalId: "prof-114",
    professionalName: "Dra. Beatriz Fontenelle",
    internalScore: 92.5,
    band: "MUITO_ALTA",
    coveredWeight: 100,
    criteria: [
      {
        criterion: "DISPONIBILIDADE",
        weight: 35,
        alignment: 100,
        contribution: 35,
        explanation: "Tem agenda aberta para começar logo.",
      },
      {
        criterion: "ABORDAGEM_INICIAL",
        weight: 30,
        alignment: 100,
        contribution: 30,
        explanation: "O primeiro encontro acontece exatamente como o paciente prefere.",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 20,
        alignment: 70,
        contribution: 14,
        explanation: "Tem experiência consolidada.",
      },
      {
        criterion: "AREA_DE_ATUACAO",
        weight: 15,
        alignment: 90,
        contribution: 13.5,
        explanation: "Trabalha exatamente com a área que o paciente priorizou.",
      },
    ],
  },
  {
    caseId: "caso-2038",
    professionalId: "prof-087",
    professionalName: "Dr. Ismael Cardoso",
    internalScore: 78.2,
    band: "ALTA",
    coveredWeight: 85,
    criteria: [
      {
        criterion: "DISPONIBILIDADE",
        weight: 35,
        alignment: 60,
        contribution: 21,
        explanation: "Tem agenda limitada — o início pode demorar um pouco.",
      },
      {
        criterion: "ABORDAGEM_INICIAL",
        weight: 30,
        alignment: 85,
        contribution: 25.5,
        explanation: "Se adapta à forma de primeiro encontro que o paciente preferir.",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 20,
        alignment: 100,
        contribution: 20,
        explanation: "Tem trajetória longa na área.",
      },
      {
        criterion: "AREA_DE_ATUACAO",
        weight: 15,
        alignment: null,
        contribution: 0,
        explanation:
          "A área de atuação não está registrada no cadastro deste profissional — nada foi presumido.",
      },
    ],
  },
  {
    caseId: "caso-2038",
    professionalId: "prof-203",
    professionalName: "Dra. Solange Vieira",
    internalScore: 71.0,
    band: "ALTA",
    coveredWeight: 100,
    criteria: [
      {
        criterion: "DISPONIBILIDADE",
        weight: 35,
        alignment: 100,
        contribution: 35,
        explanation: "Tem agenda aberta para começar logo.",
      },
      {
        criterion: "ABORDAGEM_INICIAL",
        weight: 30,
        alignment: 30,
        contribution: 9,
        explanation: "O primeiro encontro acontece de forma diferente da que o paciente prefere.",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 20,
        alignment: 70,
        contribution: 14,
        explanation: "Tem experiência consolidada.",
      },
      {
        criterion: "AREA_DE_ATUACAO",
        weight: 15,
        alignment: 90,
        contribution: 13,
        explanation: "Trabalha exatamente com a área que o paciente priorizou.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Atividades recentes — vocabulário de eventos do Motor (Engine §7)
// ---------------------------------------------------------------------------

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "ev-9",
    event: "CONFLITO_DETECTADO",
    caseId: "caso-2033",
    patientFirstName: "Cecília",
    description: "Duas opções ficaram equivalentes sob os critérios dela.",
    at: "2026-07-23T08:40:00-03:00",
    actor: "Sistema",
  },
  {
    id: "ev-8",
    event: "PERFIL_VALIDADO",
    caseId: "caso-2038",
    patientFirstName: "Joaquim",
    description: "Validou o Perfil de Prioridades depois de corrigir um peso.",
    at: "2026-07-22T17:05:00-03:00",
    actor: "Joaquim Ribeiro",
  },
  {
    id: "ev-7",
    event: "PESO_ATRIBUIDO",
    caseId: "caso-2041",
    patientFirstName: "Marina",
    description: "Continuidade recebeu 40 pontos.",
    at: "2026-07-22T14:30:00-03:00",
    actor: "Helena Vasconcelos",
  },
  {
    id: "ev-6",
    event: "MEDICO_ELIMINADO",
    caseId: "caso-2029",
    patientFirstName: "Antônio",
    description: "Sete profissionais saíram por não atuarem no estado exigido.",
    at: "2026-07-21T10:15:00-03:00",
    actor: "Sistema",
  },
  {
    id: "ev-5",
    event: "RELATORIO_ENTREGUE",
    caseId: "caso-2024",
    patientFirstName: "Rosa",
    description: "Devolutiva presencial concluída.",
    at: "2026-07-21T16:00:00-03:00",
    actor: "Helena Vasconcelos",
  },
];

export function findCase(caseId: string): PortalCase | undefined {
  return MOCK_CASES.find((entry) => entry.id === caseId);
}

export function findPriorityProfile(caseId: string): PriorityProfileMock | undefined {
  return MOCK_PRIORITY_PROFILES.find((entry) => entry.caseId === caseId);
}

export function findCompatibilities(caseId: string): CompatibilityMock[] {
  return MOCK_COMPATIBILITIES.filter((entry) => entry.caseId === caseId);
}

/**
 * Ordena os casos por "quem precisa de você agora" — nunca por urgência
 * fabricada, nunca por tempo parado. Casos aguardando o paciente vão para o
 * fim: a bola não está com o Curador, e listá-los no topo criaria uma
 * sensação de cobrança que o Método não admite (Experience §2.6).
 */
export function orderByWhatNeedsYou(cases: PortalCase[]): PortalCase[] {
  const rank = (entry: PortalCase): number => {
    if (entry.alerts.some((alert) => alert.severity === "bloqueio")) return 0;
    if (entry.alerts.length > 0) return 1;
    if (entry.nextAction.kind === "acao") return 2;
    return 3;
  };

  return [...cases]
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry) - rank(b.entry) || a.index - b.index)
    .map((item) => item.entry);
}
