// Motor de Completude do P002 — classifica campos e elimina falsos positivos
// em missingInformation. Só "informação realmente ausente" vira lacuna;
// campos fora do escopo, determinados pelo caso/curador ou já respondidos
// (inclusive com negação explícita) nunca geram pendência.

import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { MissingInformation } from "@/modules/ace/artifacts/decision-case";
import type { P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";
import type { EstadoInformacao } from "@/modules/ace/core/information-state";
import { estadoGeraPendencia } from "@/modules/ace/core/information-state";

/** @deprecated Use EstadoInformacao — mantido para compatibilidade interna. */
export type P002FieldCompletenessState =
  | "respondido"
  | "nao_se_aplica"
  | "determinado_pelo_curador"
  | "determinado_pelo_caso"
  | "informacao_ausente";

export type P002CompletenessFieldId =
  | "decision"
  | "goal"
  | "especialidade"
  | "exames"
  | "preco_consulta"
  | "outras_doencas"
  | "localizacao"
  | "convenio"
  | "modalidade"
  | "atendimento_anterior";

type FieldRule = {
  id: P002CompletenessFieldId;
  keywords: RegExp[];
  classify: (narrativeText: string, narrative: Narrative) => EstadoInformacao;
};

const EXAMS_NEGATIVE =
  /\b(n[aã]o\s+(realizou|fez|tem|possui|fez\s+nenhum)|sem\s+exames?|nunca\s+(fez|realizou)\s+exames?|nenhum\s+exame|n[aã]o\s+fiz\s+nenhum)\b/i;

const EXAMS_POSITIVE =
  /\b((realizou|fez|possui|tem|apresentou|trouxe)\s+.{0,30}exames?|resson[aâ]ncia|tomografia|raio[\s-]?x|ultrassom|laborat[oó]rio|hemograma|densitometria)\b/i;

const EXAMS_NOT_ASKED =
  /\b(exames?\s+n[aã]o\s+(foram\s+)?perguntad|n[aã]o\s+foi\s+perguntad[oa]\s+sobre\s+exames?)\b/i;

const OTHER_CONDITIONS_NEGATIVE =
  /\b(n[aã]o\s+tenho\s+outras?\s+doen[cç]as?|nega\s+outras?\s+(doen[cç]as?|condi[cç][oõ]es)|sem\s+outras?\s+(doen[cç]as?|condi[cç][oõ]es)|n[aã]o\s+possui\s+outras?\s+doen[cç]as?)\b/i;

const OTHER_CONDITIONS_POSITIVE =
  /\b(outras?\s+doen[cç]as?|comorbidades?|diabetes|hipertens[aã]o|asma|depress[aã]o)\b/i;

const SPECIALIST_VISIT_POSITIVE =
  /\b(j[aá]\s+passou\s+por\s+.{0,40}especialista|j[aá]\s+(consultou|foi\s+ao?|buscou|procurou)\s+.{0,20}especialista|j[aá]\s+vi\s+especialista|atendimento\s+anterior\s+com\s+especialista)\b/i;

const SPECIALIST_VISIT_NEGATIVE =
  /\b(nunca\s+(passou|consultou|foi\s+ao?)\s+especialista|n[aã]o\s+(passou|consultou|foi\s+ao?)\s+especialista)\b/i;

const LOCATION_POSITIVE =
  /\b(mora\s+em|regi[aã]o|bairro|cidade|estado|zona\s+(norte|sul|leste|oeste|central)|pr[oó]ximo\s+de|dist[aâ]ncia)\b/i;

const CONVENIO_POSITIVE =
  /\b(conv[eê]nio|plano\s+de\s+sa[uú]de|unimed|amil|bradesco\s+sa[uú]de|sul[aâ]merica|particular)\b/i;

const CONVENIO_NONE =
  /\b(n[aã]o\s+(tem|possui|tenho)\s+conv[eê]nio|sem\s+conv[eê]nio|n[aã]o\s+tenho\s+plano)\b/i;

const MODALITY_POSITIVE =
  /\b(presencial|online|teleconsulta|remoto|a\s+dist[aâ]ncia|hibrido|h[ií]brido)\b/i;

const MODALITY_NONE =
  /\b(n[aã]o\s+aceita\s+teleconsulta|somente\s+presencial|apenas\s+presencial)\b/i;

function mapEstadoToLegacy(estado: EstadoInformacao): P002FieldCompletenessState {
  switch (estado) {
    case "conhecido":
    case "ausencia_declarada":
      return "respondido";
    case "nao_se_aplica":
      return "nao_se_aplica";
    case "determinado_pelo_curador":
      return "determinado_pelo_curador";
    case "determinado_pelo_caso":
      return "determinado_pelo_caso";
    default:
      return "informacao_ausente";
  }
}

const FIELD_RULES: FieldRule[] = [
  {
    id: "especialidade",
    keywords: [/especialidade/i, /qual\s+m[eé]dico/i, /tipo\s+de\s+m[eé]dico/i],
    classify: () => "determinado_pelo_caso",
  },
  {
    id: "exames",
    keywords: [/exames?/i, /resson[aâ]ncia/i, /tomografia/i, /laborat[oó]rio/i],
    classify: (text, narrative) => {
      if (EXAMS_NEGATIVE.test(text)) return "ausencia_declarada";
      if (EXAMS_POSITIVE.test(text)) return "conhecido";
      if (EXAMS_NOT_ASKED.test(text) || !narrative.closingQuestionsAnswered.historia) {
        return "nao_perguntado";
      }
      return "desconhecido";
    },
  },
  {
    id: "preco_consulta",
    keywords: [
      /pre[cç]o/i,
      /valor\s+da\s+consulta/i,
      /quanto\s+custa/i,
      /or[cç]amento/i,
      /custo\s+da\s+consulta/i,
    ],
    classify: () => "nao_se_aplica",
  },
  {
    id: "outras_doencas",
    keywords: [
      /outras?\s+doen[cç]as?/i,
      /comorbidades?/i,
      /outras?\s+condi[cç][oõ]es/i,
      /doen[cç]as?\s+pr[eé][\s-]?existentes?/i,
    ],
    classify: (text) => {
      if (OTHER_CONDITIONS_NEGATIVE.test(text)) return "ausencia_declarada";
      if (OTHER_CONDITIONS_POSITIVE.test(text)) return "conhecido";
      return "desconhecido";
    },
  },
  {
    id: "localizacao",
    keywords: [/localiza[cç][aã]o/i, /regi[aã]o/i, /cidade/i, /bairro/i, /dist[aâ]ncia/i],
    classify: (text) => (LOCATION_POSITIVE.test(text) ? "conhecido" : "desconhecido"),
  },
  {
    id: "convenio",
    keywords: [/conv[eê]nio/i, /plano\s+de\s+sa[uú]de/i],
    classify: (text) => {
      if (CONVENIO_NONE.test(text)) return "ausencia_declarada";
      if (CONVENIO_POSITIVE.test(text)) return "conhecido";
      return "desconhecido";
    },
  },
  {
    id: "modalidade",
    keywords: [/presencial/i, /online/i, /teleconsulta/i, /modalidade/i, /a\s+dist[aâ]ncia/i],
    classify: (text) => {
      if (MODALITY_NONE.test(text) || MODALITY_POSITIVE.test(text)) return "conhecido";
      return "desconhecido";
    },
  },
  {
    id: "atendimento_anterior",
    keywords: [
      /especialista/i,
      /atendimento\s+anterior/i,
      /j[aá]\s+passou/i,
      /j[aá]\s+consultou/i,
    ],
    classify: (text) => {
      if (SPECIALIST_VISIT_POSITIVE.test(text)) return "conhecido";
      if (SPECIALIST_VISIT_NEGATIVE.test(text)) return "ausencia_declarada";
      return "desconhecido";
    },
  },
];

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function detectAllFieldsFromDescription(description: string): P002CompletenessFieldId[] {
  const normalized = normalizeText(description);
  const fields = new Set<P002CompletenessFieldId>();

  for (const rule of FIELD_RULES) {
    if (rule.keywords.some((pattern) => pattern.test(normalized))) {
      fields.add(rule.id);
    }
  }

  if (/prefer[eê]ncia|localiza|conv[eê]nio|modalidade|presencial|online|valor|pre[cç]o/i.test(normalized)) {
    if (/localiza|regi[aã]o|cidade|dist[aâ]ncia/i.test(normalized)) fields.add("localizacao");
    if (/conv[eê]nio|plano/i.test(normalized)) fields.add("convenio");
    if (/presencial|online|teleconsulta|modalidade/i.test(normalized)) fields.add("modalidade");
    if (/pre[cç]o|valor/i.test(normalized)) fields.add("preco_consulta");
  }

  return [...fields];
}

export function classifyP002FieldState(
  field: P002CompletenessFieldId,
  narrative: Narrative,
): EstadoInformacao {
  const rule = FIELD_RULES.find((entry) => entry.id === field);
  if (!rule) return "desconhecido";
  return rule.classify(narrative.text.trim(), narrative);
}

export function classifyP002Field(
  field: P002CompletenessFieldId,
  narrativeText: string,
): P002FieldCompletenessState {
  const narrative = { text: narrativeText, closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true } } as Narrative;
  return mapEstadoToLegacy(classifyP002FieldState(field, narrative));
}

function isFalseAbsenceClaim(description: string): boolean {
  const normalized = normalizeText(description);
  return /\b(n[aã]o\s+(foram|foi)\s+relatad[oa]s?|n[aã]o\s+mencionad[oa]s?|sem\s+men[cç][aã]o|n[aã]o\s+informad[oa]s?)\b/i.test(
    normalized,
  );
}

function shouldKeepMissingEntry(entry: MissingInformation, narrative: Narrative): boolean {
  if (entry.relatedField === "decision" || entry.relatedField === "goal") {
    return true;
  }

  if (isFalseAbsenceClaim(entry.description)) {
    return false;
  }

  const fields = detectAllFieldsFromDescription(entry.description);
  if (fields.length === 0) {
    return false;
  }

  // Lacunas agrupadas nunca permanecem — cada dimensão deve ser avaliada separadamente.
  if (fields.length > 1) {
    return false;
  }

  return estadoGeraPendencia(classifyP002FieldState(fields[0]!, narrative));
}

export function sanitizeP002MissingInformation(
  narrative: Narrative,
  missingInformation: MissingInformation[],
): MissingInformation[] {
  return missingInformation.filter((entry) => shouldKeepMissingEntry(entry, narrative));
}

export function applyP002Completeness(
  narrative: Narrative,
  extractedFields: P002ExtractedFields,
): P002ExtractedFields {
  return {
    ...extractedFields,
    missingInformation: sanitizeP002MissingInformation(narrative, extractedFields.missingInformation),
  };
}

export function classifyP002CatalogFields(narrative: Narrative): Array<{
  field: P002CompletenessFieldId;
  state: EstadoInformacao;
}> {
  return FIELD_RULES.map((rule) => ({
    field: rule.id,
    state: rule.classify(narrative.text.trim(), narrative),
  }));
}

/** Hipóteses técnicas inferidas do caso — exigem validação humana, não são pendências. */
export function inferP002TechnicalHypotheses(narrative: Narrative): Array<{
  description: string;
  field: P002CompletenessFieldId;
  requiresHumanValidation: boolean;
}> {
  const text = narrative.text.trim();
  const hypotheses: Array<{
    description: string;
    field: P002CompletenessFieldId;
    requiresHumanValidation: boolean;
  }> = [];

  const specialtyState = classifyP002FieldState("especialidade", narrative);
  if (specialtyState === "determinado_pelo_caso") {
  const clinicalHints =
    /\b(dor|joelho|coluna|card[ií]aco|pele|psicol[oó]g|ansiedade|depress[aã]o|neurol[oó]g|ortop[eé]d)\b/i.test(text);
    if (clinicalHints) {
      hypotheses.push({
        field: "especialidade",
        description:
          "Hipótese técnica de especialidade a partir do problema relatado — requer validação do Curador.",
        requiresHumanValidation: true,
      });
    }
  }

  return hypotheses;
}

/** Rejeita restrições obrigatórias sem evidência de origem na narrativa. */
export function filterUnsourcedMandatoryConstraints<T extends { originEvidence?: { quote?: string } }>(
  constraints: T[],
): T[] {
  return constraints.filter((entry) => Boolean(entry.originEvidence?.quote?.trim()));
}
