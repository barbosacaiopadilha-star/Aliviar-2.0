/**
 * Memórias de Curadoria de demonstração.
 *
 * Três casos em fases diferentes, para que o COS possa ser percorrido inteiro
 * sem banco. Todos obedecem aos invariantes da Ontologia — um mock que viola o
 * Método ensina o comportamento errado, e depois o código nasce para servir a
 * tela (verificado em `tests/unit/cos-conduction.test.ts`).
 *
 * M3 (ADR-042): as Memórias falam o vocabulário vigente — elegibilidade da
 * Mesa, Mapa de Prioridades por níveis e leitura do Motor por contagens.
 * Nenhum peso, score ou banda: reencenar o modelo aposentado nos mocks seria
 * ensinar o comportamento errado a cada teste novo.
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
    meetingHeldAt: null,
      knownFacts: [],
      openPendencies: [],
      // Base: Case novo, sem material e sem registro — o ramo B do M-001.
      hasSubmittedStory: false,
      hasLinkedDocument: false,
      preparedBefore: false,
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
    prioridades: { mapaPendentes: 26, observations: [], preferencias: [], history: [] },
    priorityProfileId: null,
    validacao: null,
    curadoriaTecnica: {
      elegibilidade: { found: 0, awaitingArea: 0, eligible: 0, eliminated: 0, pendingInfo: 0 },
      leituras: [],
      foraDaSelecao: [],
      professionalNames: {},
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
// caso-2041 — Marina: em PRIORIDADES, com 3 subcritérios por classificar
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
    meetingHeldAt: null,
    knownFacts: [
      "Marina acompanha o pai, 78 anos.",
      "Mora em cidade diferente da do pai.",
      "Dois exames anexados antes da conversa.",
    ],
    openPendencies: [],
    hasSubmittedStory: true,
    hasLinkedDocument: true,
    preparedBefore: true,
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
    mapaPendentes: 3,
    observations: [
      "Prefere consultas pela manhã — o pai fica mais disposto.",
      "Marina participa das consultas; considera isso inegociável.",
    ],
    preferencias: [],
    history: [
      { at: "2026-07-22T14:10:00-03:00", description: "Retornos classificado como Muito importante." },
      { at: "2026-07-22T14:20:00-03:00", description: "Casos semelhantes classificado como Importante." },
      { at: "2026-07-22T14:30:00-03:00", description: "Localização classificada como Relevante." },
    ],
  },
});

// ---------------------------------------------------------------------------
// caso-2038 — Joaquim: reconhecido, quatro elegíveis, aguardando seleção
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
    meetingHeldAt: null,
    knownFacts: ["Adiou procurar ajuda por quase um ano.", "Trabalha por conta própria."],
    openPendencies: [],
    hasSubmittedStory: true,
    hasLinkedDocument: false,
    preparedBefore: true,
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
    mapaPendentes: 0,
    observations: ["Prefere atendimento no fim do dia, depois das 18h."],
    preferencias: [],
    history: [
      {
        at: "2026-07-22T16:55:00-03:00",
        description: "Disponibilidade reclassificada de Importante para Muito importante por Joaquim.",
      },
    ],
  },
  validacao: {
    validatedAt: "2026-07-22T17:05:00-03:00",
    validationNote:
      "Li o Mapa em voz alta, nível a nível. Joaquim pediu para subir Disponibilidade e disse: 'é isso, agora tá a minha cara'.",
    correctionsMade: ["Disponibilidade: de Importante para Muito importante"],
  },
  curadoriaTecnica: {
    elegibilidade: { found: 6, awaitingArea: 0, eligible: 4, eliminated: 2, pendingInfo: 0 },
    leituras: [
      {
        professionalId: "prof-114",
        professionalName: "Dra. Beatriz Fontenelle",
        totalSubcriteria: 26,
        highCompatibility: 14,
        mediumCompatibility: 9,
        informationGaps: 0,
        notRelevant: 3,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
      {
        professionalId: "prof-087",
        professionalName: "Dr. Ismael Cardoso",
        totalSubcriteria: 26,
        highCompatibility: 10,
        mediumCompatibility: 10,
        informationGaps: 3,
        notRelevant: 3,
        gapsWithoutAnyRecord: 2,
        notDeclaredByCase: 0,
      },
      {
        professionalId: "prof-203",
        professionalName: "Dra. Solange Vieira",
        totalSubcriteria: 26,
        highCompatibility: 9,
        mediumCompatibility: 13,
        informationGaps: 1,
        notRelevant: 3,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
      {
        professionalId: "prof-155",
        professionalName: "Dr. Rafael Toledo",
        totalSubcriteria: 26,
        highCompatibility: 7,
        mediumCompatibility: 14,
        informationGaps: 2,
        notRelevant: 3,
        gapsWithoutAnyRecord: 1,
        notDeclaredByCase: 0,
      },
    ],
    foraDaSelecao: [
      {
        professionalId: "prof-301",
        professionalName: "Dr. Henrique Sá",
        motivo: "Não atende: Atendimento em SP.",
      },
      {
        professionalId: "prof-088",
        professionalName: "Dra. Lúcia Ferraz",
        motivo: "Não atende: Atendimento em SP.",
      },
    ],
    professionalNames: {
      "prof-114": "Dra. Beatriz Fontenelle",
      "prof-087": "Dr. Ismael Cardoso",
      "prof-203": "Dra. Solange Vieira",
      "prof-155": "Dr. Rafael Toledo",
      "prof-301": "Dr. Henrique Sá",
      "prof-088": "Dra. Lúcia Ferraz",
    },
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
    meetingHeldAt: null,
    knownFacts: ["Primeira busca por Curadoria."],
    openPendencies: [],
    hasSubmittedStory: true,
    hasLinkedDocument: false,
    preparedBefore: true,
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
    mapaPendentes: 0,
    observations: [],
    preferencias: [],
    history: [],
  },
  validacao: {
    validatedAt: "2026-07-08T10:35:00-03:00",
    validationNote:
      "Rosa ouviu o Mapa inteiro e disse que não mudaria nada. Perguntei o que estava faltando; ela disse que estava completo.",
    correctionsMade: [],
  },
  curadoriaTecnica: {
    elegibilidade: { found: 3, awaitingArea: 0, eligible: 3, eliminated: 0, pendingInfo: 0 },
    leituras: [
      {
        professionalId: "prof-114",
        professionalName: "Dra. Beatriz Fontenelle",
        totalSubcriteria: 26,
        highCompatibility: 15,
        mediumCompatibility: 8,
        informationGaps: 0,
        notRelevant: 3,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
      {
        professionalId: "prof-087",
        professionalName: "Dr. Ismael Cardoso",
        totalSubcriteria: 26,
        highCompatibility: 12,
        mediumCompatibility: 11,
        informationGaps: 0,
        notRelevant: 3,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
      {
        professionalId: "prof-203",
        professionalName: "Dra. Solange Vieira",
        totalSubcriteria: 26,
        highCompatibility: 10,
        mediumCompatibility: 13,
        informationGaps: 0,
        notRelevant: 3,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
    ],
    foraDaSelecao: [],
    professionalNames: {
      "prof-114": "Dra. Beatriz Fontenelle",
      "prof-087": "Dr. Ismael Cardoso",
      "prof-203": "Dra. Solange Vieira",
    },
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
        relationToWeights:
          "Alta compatibilidade nos itens que Rosa declarou como muito importantes — experiência e continuidade.",
        favorablePoints: ["Trajetória longa", "Acompanha ao longo do tempo"],
        attentionPoints: ["Agenda mais concorrida — o início pode levar algumas semanas"],
        suggestedQuestions: ["Como funciona o acompanhamento entre as consultas?"],
        relationalReading: null,
      curatorObservations: null,
      },
      {
        professionalId: "prof-087",
        position: 2,
        justification: "Equilibra experiência e disponibilidade de forma diferente da primeira opção.",
        relationToWeights:
          "Responde bem à experiência que Rosa priorizou; a continuidade aparece com aderência média.",
        favorablePoints: ["Começa mais rápido"],
        attentionPoints: ["Acompanhamento contínuo não é o formato principal dele"],
        suggestedQuestions: ["O acompanhamento seria com você mesmo ou com a equipe?"],
        relationalReading: null,
      curatorObservations: null,
      },
      {
        professionalId: "prof-203",
        position: 3,
        justification: "A opção que começa mais rápido, mantendo boa aderência ao que Rosa priorizou.",
        relationToWeights: "Responde com folga ao prazo para consulta que Rosa declarou relevante.",
        favorablePoints: ["Agenda aberta"],
        attentionPoints: ["Menos tempo de trajetória que as outras duas"],
        suggestedQuestions: ["Quantos casos parecidos você acompanha hoje?"],
        relationalReading: null,
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
