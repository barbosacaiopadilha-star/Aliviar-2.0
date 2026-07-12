export type ParaQuemOption = "para-mim" | "para-outra-pessoa";

export type PreferenciaModalidade = "online" | "presencial" | "tanto-faz";

export const STORY_STEPS = [
  "para-quem",
  "motivo",
  "historia",
  "informacoes",
  "preferencias",
  "revisao",
] as const;

export type StoryStep = (typeof STORY_STEPS)[number];

// Só os campos do formulário em si — status/submissão vivem em PatientStory,
// nunca aqui (ADR-018: a conclusão é responsabilidade do servidor, não um
// campo solto no rascunho).
export type SuaHistoriaData = {
  paraQuem?: ParaQuemOption;
  motivo?: string;
  historia?: string;
  informacoesImportantes?: string;
  preferenciaModalidade?: PreferenciaModalidade;
};

export type StoryStatus = "rascunho" | "enviada";

// Espelha public.patient_stories (ÉPICO 1/SPRINT 1) — fundação permanente,
// vinculada ao profile_id do paciente autenticado (nunca preenchimento
// anônimo, ADR-018).
export type PatientStory = {
  id: string;
  status: StoryStatus;
  currentStep: StoryStep;
  data: SuaHistoriaData;
  revision: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoryActionResult = { success: true } | { success: false; error: string };
