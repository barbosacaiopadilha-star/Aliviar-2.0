import type { CuradoriaBriefingData } from "./types";
import { buildSuggestions, hasBothSides } from "./suggestions";

/**
 * Cenário de demonstração do Briefing — usado em testes e para inspecionar o
 * componente sem banco. Nunca importado por código de produção.
 */
export function buildMockBriefing(): CuradoriaBriefingData {
  const patientAnswers: CuradoriaBriefingData["patientAnswers"] = [
    {
      questionId: "PA1",
      option: "LER_SOZINHO",
      verbatim: "Eu preciso ler com calma antes de responder qualquer coisa.",
      answeredAt: "2026-07-20T10:00:00.000Z",
      dataClass: "PREFERENCIA",
      origin: "PACIENTE",
    },
    {
      questionId: "PA2",
      option: "DECIDIR_JUNTO",
      verbatim: "Não quero só receber a receita pronta.",
      answeredAt: "2026-07-20T10:01:00.000Z",
      dataClass: "PREFERENCIA",
      origin: "PACIENTE",
    },
    {
      questionId: "PA3",
      option: "TEM_ALGO",
      verbatim: "Da última vez eu saí do consultório sem saber o que ia acontecer depois.",
      answeredAt: "2026-07-20T10:02:00.000Z",
      dataClass: "PREFERENCIA",
      origin: "PACIENTE",
    },
  ];

  const professionalAnswers: CuradoriaBriefingData["professionalAnswers"] = new Map([
    [
      "prof-1",
      [
        {
          questionId: "ME1" as const,
          option: "TAMBEM_POR_ESCRITO",
          declaredText: null,
          declaredAt: "2026-06-01T12:00:00.000Z",
          dataClass: "FATO" as const,
          origin: "MEDICO" as const,
        },
        {
          questionId: "ME2" as const,
          option: "CANAL_DIRETO",
          declaredText: null,
          declaredAt: "2026-06-01T12:00:00.000Z",
          dataClass: "FATO" as const,
          origin: "MEDICO" as const,
        },
      ],
    ],
  ]);

  const observations: CuradoriaBriefingData["observations"] = [
    {
      id: "obs-1",
      caseId: "case-1",
      kind: "CU3",
      note: "Antes de decidir, é preciso conversar sobre a distância até o consultório.",
      authorId: "curador-1",
      authorName: "Curador de Demonstração",
      observedAt: "2026-07-20T11:00:00.000Z",
      dataClass: "INTERPRETACAO",
      origin: "CURADOR",
    },
  ];

  const suggestions = buildSuggestions({
    patientAnswers,
    professionalAnswers: professionalAnswers.get("prof-1") ?? [],
    professionalName: "Dra. Demonstração",
    observations,
  }).filter(hasBothSides);

  return {
    caseId: "case-1",
    patientFirstName: "Ana",
    patientAnswers,
    professionalAnswers,
    professionalNames: new Map([["prof-1", "Dra. Demonstração"]]),
    observations,
    suggestions,
  };
}
