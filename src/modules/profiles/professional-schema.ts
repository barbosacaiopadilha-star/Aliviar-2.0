import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export const professionalProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Informe o nome de exibição.")
    .max(160, "Nome muito longo."),
  professionalIdentifier: z
    .string()
    .trim()
    .min(2, "Informe a identificação profissional.")
    .max(60, "Identificação muito longa."),
  crm: z.preprocess(emptyToUndefined, z.string().trim().max(20, "CRM muito longo.").optional()),
  crmUf: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a sigla do estado (2 letras), ex.: SP.")
      .optional(),
  ),
  professionalSummary: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000, "Resumo muito longo.").optional(),
  ),
  institutionName: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(160, "Nome da instituição muito longo.").optional(),
  ),

  // Campos que o Motor de Compatibilidade lê (MISSÃO 209, Fase 5). Existiam
  // no banco desde a Sprint do ACE, mas nenhuma superfície os escrevia — sem
  // eles, cinco dos seis critérios do Método viram lacuna e toda análise sai
  // com a mesma faixa, tecnicamente honesta e inútil para decidir.
  //
  // Todos opcionais: um profissional pode ser aprovado antes de a Aliviar ter
  // levantado tudo sobre ele. Ausência é lacuna declarada, nunca valor
  // presumido (Ontologia, Invariante 34).
  experienceLevel: z.preprocess(
    emptyToUndefined,
    z.enum(["geral", "experiente", "altamente_experiente"]).optional(),
  ),
  intakeApproach: z.preprocess(
    emptyToUndefined,
    z.enum(["conexao_direta", "aprofundamento_previo", "avaliacao_inicial", "ambos"]).optional(),
  ),
  offersContinuousCare: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value === "true" || value === true),
    z.boolean().optional(),
  ),
  availabilityWindow: z.preprocess(
    emptyToUndefined,
    z.enum(["flexible", "limited", "unavailable_soon"]).optional(),
  ),
  competencyDomains: z.preprocess(
    (value) => (Array.isArray(value) ? value : value === undefined || value === "" ? [] : [value]),
    z.array(z.enum(["saude_emocional_mental", "saude_fisica", "nao_determinado"])).default([]),
  ),
});

/** Rótulos em linguagem de pessoa — nunca o valor técnico na tela. */
export const EXPERIENCE_LEVEL_LABELS = {
  geral: "Experiência geral",
  experiente: "Experiente",
  altamente_experiente: "Altamente experiente",
} as const;

export const INTAKE_APPROACH_LABELS = {
  conexao_direta: "Conexão direta",
  aprofundamento_previo: "Aprofundamento prévio",
  avaliacao_inicial: "Avaliação inicial",
  ambos: "Se adapta a ambos",
} as const;

export const AVAILABILITY_WINDOW_LABELS = {
  flexible: "Agenda aberta",
  limited: "Agenda limitada",
  unavailable_soon: "Sem agenda no curto prazo",
} as const;

export const COMPETENCY_DOMAIN_LABELS = {
  saude_emocional_mental: "Saúde emocional e mental",
  saude_fisica: "Saúde física",
  nao_determinado: "Não determinado",
} as const;

export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;

export const professionalStatusSchema = z.enum(["ativo", "inativo"]);
export const professionalPublicationStatusSchema = z.enum(["publicado", "nao_publicado"]);
