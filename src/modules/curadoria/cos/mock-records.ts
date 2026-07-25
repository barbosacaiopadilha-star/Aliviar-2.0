/**
 * Memórias de Curadoria de demonstração.
 *
 * Três casos em fases diferentes, para que o COS possa ser percorrido inteiro
 * sem banco. Todos obedecem aos invariantes da Ontologia — um mock que viola o
 * Método ensina o comportamento errado, e depois o código nasce para servir a
 * tela (verificado em `tests/unit/cos-conduction.test.ts`).
 */

import type { CuradoriaRecord } from "./types";

function baseRecord(
  overrides: Pick<CuradoriaRecord, "caseId" | "patientName" | "patientFirstName" | "openedAt"> &
    Partial<CuradoriaRecord>,
): CuradoriaRecord {
  return {
    curatorName: "Helena Vasconcelos",
    promisedReturn: null,
    acolhimento: {
      contextReviewed: false,
      documentsReviewed: false,
      meetingScheduledAt: null,
      knownFacts: [],
      openPendencies: [],
    },
    historia: {
      narrative: null,
      motivation: null,
      understandingConfirmedAt: null,
      registeredAt: null,
    },
    caso: {
      diagnosis: null,
      hypothesis: null,
      exams: [],
      treatments: [],
      clinicalContext: null,
      limitations: [],
    },
    filtros: [],
    prioridades: { weights: [], observations: [], preferencias: [], history: [] },
    priorityProfileId: null,
    validacao: null,
    curadoriaTecnica: {
      computedAt: null,
      analyses: [],
      excluded: [],
      selectedProfessionalIds: [],
      selectedBy: null,
      selectedAt: null,

      curatedSelectionId: null,
    },
    relatorio: { options: [], compositionRationale: null, emittedAt: null, deliveredAt: null },
    devolutiva: {
      presentedAt: null,
      patientQuestions: [],
      observations: [],
      decision: null,
      nextSteps: [],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// caso-2041 — Marina: em PRIORIDADES, faltando 15 pontos
// ---------------------------------------------------------------------------

const marina: CuradoriaRecord = baseRecord({
  caseId: "caso-2041",
  patientName: "Marina Alencar",
  patientFirstName: "Marina",
  openedAt: "2026-07-20T09:00:00-03:00",
  promisedReturn: "2026-07-25",
  acolhimento: {
    contextReviewed: true,
    documentsReviewed: true,
    meetingScheduledAt: "2026-07-21T10:00:00-03:00",
    knownFacts: [
      "Marina acompanha o pai, 78 anos.",
      "Mora em cidade diferente da do pai.",
      "Dois exames anexados antes da conversa.",
    ],
    openPendencies: [],
  },
  historia: {
    narrative:
      "Marina acompanha o pai, 78 anos, depois de uma queda em casa. Ela mora em outra cidade e trabalha em escala fixa. O que mais a angustia não é o diagnóstico — é imaginar o pai sendo atendido por alguém diferente a cada consulta.",
    motivation: "\"Eu queria alguém que conhecesse ele, não que lesse o prontuário na hora.\"",
    understandingConfirmedAt: "2026-07-21T10:48:00-03:00",
    registeredAt: "2026-07-21T10:45:00-03:00",
  },
  caso: {
    diagnosis: null,
    hypothesis: "Investigação de causa da queda, em andamento pelo clínico do pai.",
    exams: ["Hemograma (jun/2026)", "Densitometria (mai/2026)"],
    treatments: ["Fisioterapia domiciliar, 2x/semana"],
    clinicalContext:
      "Idoso com queda recente, sem diagnóstico fechado. Acompanhamento familiar presente e disponível.",
    limitations: ["Não dirige", "Depende da filha para ir às consultas"],
  },
  // Caso de ensino deliberado: a mesma fala de Marina foi registrada como
  // filtro obrigatório E como critério com peso (Continuidade, 40 pontos).
  // O Motor detecta I-03 — ou o aspecto elimina, ou pesa, nunca os dois
  // (Ontologia, Invariante 24). É o tipo de engano real que acontece quando a
  // conversa flui, e o COS precisa saber apanhá-lo.
  filtros: [
    {
      id: "f1",
      kind: "CUIDADO_CONTINUO",
      label: "Oferece acompanhamento contínuo",
      value: "true",
      reason: "\"Eu não quero que ele tenha que contar a história dele de novo toda vez.\"",
    },
  ],
  prioridades: {
    weights: [
      {
        criterion: "CONTINUIDADE",
        weight: 40,
        targetValue: null,
        evidence: "\"Eu não quero que ele tenha que contar a história dele de novo toda vez.\"",
        registeredAt: "2026-07-22T14:10:00-03:00",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 30,
        targetValue: null,
        evidence: "\"Com a idade dele, eu queria alguém que já tivesse visto muito caso parecido.\"",
        registeredAt: "2026-07-22T14:20:00-03:00",
      },
      {
        criterion: "LOCALIZACAO",
        weight: 15,
        targetValue: "SP",
        evidence: "\"Perto de casa ajuda muito, mas eu consigo me virar se for necessário.\"",
        registeredAt: "2026-07-22T14:30:00-03:00",
      },
    ],
    observations: [
      "Prefere consultas pela manhã — o pai fica mais disposto.",
      "Marina participa das consultas; considera isso inegociável.",
    ],
    preferencias: [],
    history: [
      { at: "2026-07-22T14:10:00-03:00", description: "Continuidade recebeu 40 pontos." },
      { at: "2026-07-22T14:20:00-03:00", description: "Experiência recebeu 30 pontos." },
      { at: "2026-07-22T14:30:00-03:00", description: "Localização recebeu 15 pontos." },
    ],
  },
});

// ---------------------------------------------------------------------------
// caso-2038 — Joaquim: validado, comparação feita, aguardando seleção
// ---------------------------------------------------------------------------

const joaquim: CuradoriaRecord = baseRecord({
  caseId: "caso-2038",
  patientName: "Joaquim Ribeiro",
  patientFirstName: "Joaquim",
  openedAt: "2026-07-15T11:20:00-03:00",
  promisedReturn: "2026-07-24",
  acolhimento: {
    contextReviewed: true,
    documentsReviewed: true,
    meetingScheduledAt: "2026-07-18T18:30:00-03:00",
    knownFacts: ["Adiou procurar ajuda por quase um ano.", "Trabalha por conta própria."],
    openPendencies: [],
  },
  historia: {
    narrative:
      "Joaquim, 54 anos, adiou procurar ajuda por quase um ano. Trabalha por conta própria e não pode parar. Chegou dizendo que já tinha desistido de encontrar alguém que 'não o tratasse como número'.",
    motivation: "\"Eu já tentei antes e desisti no meio. Não quero passar por isso de novo.\"",
    understandingConfirmedAt: "2026-07-18T19:12:00-03:00",
    registeredAt: "2026-07-18T19:05:00-03:00",
  },
  caso: {
    diagnosis: null,
    hypothesis: null,
    exams: [],
    treatments: [],
    clinicalContext:
      "Busca avaliação inicial em saúde emocional. Sem acompanhamento anterior concluído.",
    limitations: ["Só consegue atendimento após as 18h"],
  },
  filtros: [
    {
      id: "f1",
      kind: "UF",
      label: "Estado de atuação",
      value: "SP",
      reason: "\"Não tenho como sair do estado, meu trabalho é aqui.\"",
    },
  ],
  prioridades: {
    weights: [
      {
        criterion: "DISPONIBILIDADE",
        weight: 35,
        targetValue: null,
        evidence: "\"Se demorar um mês pra marcar, eu desisto de novo. Eu me conheço.\"",
        registeredAt: "2026-07-22T16:20:00-03:00",
      },
      {
        criterion: "ABORDAGEM_INICIAL",
        weight: 30,
        targetValue: "avaliacao_inicial",
        evidence: "\"Queria começar entendendo direito o que eu tenho, sem pressa de já tratar.\"",
        registeredAt: "2026-07-22T16:30:00-03:00",
      },
      {
        criterion: "EXPERIENCIA",
        weight: 20,
        targetValue: null,
        evidence: "\"Experiência conta, mas não é o que mais pesa pra mim.\"",
        registeredAt: "2026-07-22T16:40:00-03:00",
      },
      {
        criterion: "AREA_DE_ATUACAO",
        weight: 15,
        targetValue: "saude_emocional_mental",
        evidence: "\"Precisa ser alguém que trabalhe com isso mesmo, não alguém que atende de tudo.\"",
        registeredAt: "2026-07-22T16:50:00-03:00",
      },
    ],
    observations: ["Prefere atendimento no fim do dia, depois das 18h."],
    preferencias: [],
    history: [
      { at: "2026-07-22T16:55:00-03:00", description: "Experiência corrigida de 30 para 20 por Joaquim." },
    ],
  },
  validacao: {
    validatedAt: "2026-07-22T17:05:00-03:00",
    validationNote:
      "Li os quatro pesos em voz alta na ordem. Joaquim corrigiu experiência de 30 para 20 e disse: 'é isso, agora tá a minha cara'.",
    correctionsMade: ["Experiência: de 30 para 20 pontos"],
  },
  curadoriaTecnica: {
    computedAt: "2026-07-23T09:15:00-03:00",
    analyses: [
      {
        professionalId: "prof-114",
        professionalName: "Dra. Beatriz Fontenelle",
        internalScore: 92.5,
        band: "MUITO_ALTA",
        coveredWeight: 100,
        curatorNote: null,
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
        professionalId: "prof-087",
        professionalName: "Dr. Ismael Cardoso",
        internalScore: 78.2,
        band: "ALTA",
        coveredWeight: 85,
        curatorNote: "Único com experiência longa em quadro parecido com o do Joaquim.",
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
        professionalId: "prof-203",
        professionalName: "Dra. Solange Vieira",
        internalScore: 71,
        band: "ALTA",
        coveredWeight: 100,
        curatorNote: null,
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
      {
        professionalId: "prof-155",
        professionalName: "Dr. Rafael Toledo",
        internalScore: 69.4,
        band: "BOA",
        coveredWeight: 100,
        curatorNote: null,
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
            alignment: 40,
            contribution: 8,
            explanation: "Tem experiência geral, não concentrada nesta área.",
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
    ],
    excluded: [
      {
        professionalId: "prof-301",
        professionalName: "Dr. Henrique Sá",
        failures: ["Não atua em SP."],
      },
      {
        professionalId: "prof-088",
        professionalName: "Dra. Lúcia Ferraz",
        failures: ["Não atua em SP."],
      },
    ],
    selectedProfessionalIds: [],
    selectedBy: null,
    selectedAt: null,

    curatedSelectionId: null,
  },
});

// ---------------------------------------------------------------------------
// caso-2024 — Rosa: relatório entregue, aguardando decisão
// ---------------------------------------------------------------------------

const rosa: CuradoriaRecord = baseRecord({
  caseId: "caso-2024",
  patientName: "Rosa Etsuko Nakamura",
  patientFirstName: "Rosa",
  openedAt: "2026-07-02T13:45:00-03:00",
  acolhimento: {
    contextReviewed: true,
    documentsReviewed: true,
    meetingScheduledAt: "2026-07-05T09:00:00-03:00",
    knownFacts: ["Primeira busca por Curadoria."],
    openPendencies: [],
  },
  historia: {
    narrative:
      "Rosa, 61 anos, procurou a Aliviar depois de duas consultas em que sentiu que não foi ouvida. Queria entender as opções antes de decidir qualquer coisa.",
    motivation: "\"Eu só quero entender o que está acontecendo comigo antes de decidir.\"",
    understandingConfirmedAt: "2026-07-05T09:52:00-03:00",
    registeredAt: "2026-07-05T09:45:00-03:00",
  },
  caso: {
    diagnosis: null,
    hypothesis: null,
    exams: ["Ressonância (jun/2026)"],
    treatments: [],
    clinicalContext: "Busca segunda leitura sobre conduta proposta anteriormente.",
    limitations: [],
  },
  filtros: [
    {
      id: "f1",
      kind: "UF",
      label: "Estado de atuação",
      value: "SP",
      reason: "\"Não tenho como viajar para consulta.\"",
    },
  ],
  prioridades: {
    weights: [
      {
        criterion: "EXPERIENCIA",
        weight: 45,
        targetValue: null,
        evidence: "\"Depois do que passei, eu quero alguém que já viu isso muitas vezes.\"",
        registeredAt: "2026-07-08T10:00:00-03:00",
      },
      {
        criterion: "CONTINUIDADE",
        weight: 35,
        targetValue: null,
        evidence: "\"Não quero recomeçar do zero de novo com outra pessoa.\"",
        registeredAt: "2026-07-08T10:10:00-03:00",
      },
      {
        criterion: "DISPONIBILIDADE",
        weight: 20,
        targetValue: null,
        evidence: "\"Posso esperar um pouco se for pra ser bem feito.\"",
        registeredAt: "2026-07-08T10:20:00-03:00",
      },
    ],
    observations: [],
    preferencias: [],
    history: [],
  },
  validacao: {
    validatedAt: "2026-07-08T10:35:00-03:00",
    validationNote:
      "Rosa ouviu os três pesos e disse que não mudaria nada. Perguntei o que estava faltando; ela disse que estava completo.",
    correctionsMade: [],
  },
  curadoriaTecnica: {
    computedAt: "2026-07-14T11:00:00-03:00",
    analyses: [
      {
        professionalId: "prof-114",
        professionalName: "Dra. Beatriz Fontenelle",
        internalScore: 88,
        band: "MUITO_ALTA",
        coveredWeight: 100,
        curatorNote: null,
        criteria: [],
      },
      {
        professionalId: "prof-087",
        professionalName: "Dr. Ismael Cardoso",
        internalScore: 82,
        band: "ALTA",
        coveredWeight: 100,
        curatorNote: null,
        criteria: [],
      },
      {
        professionalId: "prof-203",
        professionalName: "Dra. Solange Vieira",
        internalScore: 74,
        band: "ALTA",
        coveredWeight: 100,
        curatorNote: null,
        criteria: [],
      },
    ],
    excluded: [],
    selectedProfessionalIds: ["prof-114", "prof-087", "prof-203"],
    selectedBy: "Helena Vasconcelos",
    selectedAt: "2026-07-16T14:00:00-03:00",

    curatedSelectionId: null,
  },
  relatorio: {
    options: [
      {
        professionalId: "prof-114",
        position: 1,
        justification: "Responde ao que Rosa colocou como mais importante: trajetória longa na área.",
        relationToWeights: "Atende com força os 45 pontos de Experiência e os 35 de Continuidade.",
        favorablePoints: ["Trajetória longa", "Acompanha ao longo do tempo"],
        attentionPoints: ["Agenda mais concorrida — o início pode levar algumas semanas"],
        suggestedQuestions: ["Como funciona o acompanhamento entre as consultas?"],
        curatorObservations: null,
      },
      {
        professionalId: "prof-087",
        position: 2,
        justification: "Equilibra experiência e disponibilidade de forma diferente da primeira opção.",
        relationToWeights: "Atende bem Experiência; Continuidade é atendida de forma parcial.",
        favorablePoints: ["Começa mais rápido"],
        attentionPoints: ["Acompanhamento contínuo não é o formato principal dele"],
        suggestedQuestions: ["O acompanhamento seria com você mesmo ou com a equipe?"],
        curatorObservations: null,
      },
      {
        professionalId: "prof-203",
        position: 3,
        justification: "A opção que começa mais rápido, mantendo boa aderência ao que Rosa priorizou.",
        relationToWeights: "Atende os 20 pontos de Disponibilidade com folga.",
        favorablePoints: ["Agenda aberta"],
        attentionPoints: ["Menos tempo de trajetória que as outras duas"],
        suggestedQuestions: ["Quantos casos parecidos você acompanha hoje?"],
        curatorObservations: null,
      },
    ],
    compositionRationale:
      "As três respondem à prioridade de experiência de formas diferentes: uma pela trajetória, outra pelo equilíbrio com o tempo de espera, a terceira pela rapidez de início. Rosa escolhe qual troca faz sentido para ela.",
    emittedAt: "2026-07-20T09:00:00-03:00",

    deliveredAt: null,
  },
  devolutiva: {
    presentedAt: "2026-07-21T16:00:00-03:00",
    patientQuestions: [
      "Se eu não me adaptar, posso trocar?",
      "As três atendem pelo meu convênio?",
    ],
    observations: ["Rosa pediu para levar o relatório e conversar com a filha antes de decidir."],
    decision: null,
    nextSteps: ["Aguardar o retorno dela, sem cobrar."],
  },
});

export const MOCK_RECORDS: Record<string, CuradoriaRecord> = {
  "caso-2041": marina,
  "caso-2038": joaquim,
  "caso-2024": rosa,
};

export function findRecord(caseId: string): CuradoriaRecord | undefined {
  return MOCK_RECORDS[caseId];
}
