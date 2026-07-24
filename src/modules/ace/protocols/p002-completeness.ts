// Motor de Completude do P002 — classifica campos e elimina falsos positivos
// em missingInformation. Só "informação realmente ausente" vira lacuna;
// campos fora do escopo, determinados pelo caso/curador ou já respondidos
// (inclusive com negação explícita) nunca geram pendência.

import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { MissingInformation } from "@/modules/ace/artifacts/decision-case";
import type { P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";

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
  | "outras_doencas";

type FieldRule = {
  id: P002CompletenessFieldId;
  keywords: RegExp[];
  classify: (narrativeText: string) => P002FieldCompletenessState;
};

const EXAMS_NEGATIVE =
  /\b(n[aã]o\s+(realizou|fez|tem|possui|fez\s+nenhum)|sem\s+exames?|nunca\s+(fez|realizou)\s+exames?|nenhum\s+exame)\b/i;

const EXAMS_POSITIVE =
  /\b(exames?|resson[aâ]ncia|tomografia|raio[\s-]?x|ultrassom|laborat[oó]rio|hemograma|densitometria)\b/i;

const FIELD_RULES: FieldRule[] = [
  {
    id: "especialidade",
    keywords: [/especialidade/i, /qual\s+m[eé]dico/i, /tipo\s+de\s+m[eé]dico/i],
    classify: () => "determinado_pelo_caso",
  },
  {
    id: "exames",
    keywords: [/exames?/i, /resson[aâ]ncia/i, /tomografia/i, /laborat[oó]rio/i],
    classify: (text) => {
      if (EXAMS_NEGATIVE.test(text)) return "respondido";
      if (EXAMS_POSITIVE.test(text)) return "respondido";
      return "informacao_ausente";
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
    classify: () => "respondido",
  },
];

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function detectFieldFromDescription(description: string): P002CompletenessFieldId | null {
  const normalized = normalizeText(description);

  for (const rule of FIELD_RULES) {
    if (rule.keywords.some((pattern) => pattern.test(normalized))) {
      return rule.id;
    }
  }

  return null;
}

export function classifyP002Field(
  field: P002CompletenessFieldId,
  narrativeText: string,
): P002FieldCompletenessState {
  const rule = FIELD_RULES.find((entry) => entry.id === field);
  if (!rule) {
    return "informacao_ausente";
  }

  return rule.classify(narrativeText);
}

function shouldKeepMissingEntry(
  entry: MissingInformation,
  narrativeText: string,
): boolean {
  if (entry.relatedField === "decision" || entry.relatedField === "goal") {
    return true;
  }

  const field = detectFieldFromDescription(entry.description);
  if (!field) {
    // Lacuna genérica sem campo reconhecido: não vira pendência automática.
    return false;
  }

  return classifyP002Field(field, narrativeText) === "informacao_ausente";
}

export function sanitizeP002MissingInformation(
  narrative: Narrative,
  missingInformation: MissingInformation[],
): MissingInformation[] {
  const narrativeText = narrative.text.trim();
  return missingInformation.filter((entry) => shouldKeepMissingEntry(entry, narrativeText));
}

export function applyP002Completeness(
  narrative: Narrative,
  extractedFields: P002ExtractedFields,
): P002ExtractedFields {
  return {
    ...extractedFields,
    missingInformation: sanitizeP002MissingInformation(
      narrative,
      extractedFields.missingInformation,
    ),
  };
}

export function classifyP002CatalogFields(narrative: Narrative): Array<{
  field: P002CompletenessFieldId;
  state: P002FieldCompletenessState;
}> {
  const text = narrative.text.trim();
  return FIELD_RULES.map((rule) => ({
    field: rule.id,
    state: rule.classify(text),
  }));
}
