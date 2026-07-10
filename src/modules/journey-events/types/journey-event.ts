export type JourneyEventCategory =
  | "JOURNEY"
  | "CONTACT"
  | "CONSULTATION"
  | "EXAM"
  | "DOCUMENT"
  | "DECISION"
  | "OPERATIONAL"
  | "OBSERVATION";

export type JourneyEventSource = "MANUAL" | "SYSTEM";

export interface JourneyEvent {
  id: string;
  journey_id: string;
  category: JourneyEventCategory;
  source: JourneyEventSource;
  title: string;
  description: string | null;
  journey_impact: string | null;
  next_step: string | null;
  occurred_at: string;
  is_highlighted: boolean;
  is_corrected: boolean;
  corrected_event_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyEventWithAuthor extends JourneyEvent {
  author?: {
    id: string;
    full_name: string;
  };
  corrected_original?: Pick<JourneyEvent, "id" | "title" | "occurred_at"> | null;
}

export const JOURNEY_EVENT_CATEGORY_LABELS: Record<JourneyEventCategory, string> = {
  JOURNEY: "Jornada",
  CONTACT: "Contato",
  CONSULTATION: "Consulta",
  EXAM: "Exame",
  DOCUMENT: "Documento",
  DECISION: "Decisão do paciente",
  OPERATIONAL: "Organização",
  OBSERVATION: "Observação",
};

export const ALL_JOURNEY_EVENT_CATEGORIES: JourneyEventCategory[] = [
  "JOURNEY",
  "CONTACT",
  "CONSULTATION",
  "EXAM",
  "DOCUMENT",
  "DECISION",
  "OPERATIONAL",
  "OBSERVATION",
];

export function formatEventDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
