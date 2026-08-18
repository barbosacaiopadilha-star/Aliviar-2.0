export const PROFESSIONAL_WORKFLOW_STEPS = [
  { id: "cadastro", label: "Cadastro" },
  { id: "publicacao", label: "Publicação" },
  { id: "rede", label: "Rede" },
  { id: "documentos", label: "Documentos e formação" },
  { id: "protocolo", label: "Protocolo" },
  { id: "mapa", label: "Mapa" },
] as const;

export type ProfessionalWorkflowStepId =
  (typeof PROFESSIONAL_WORKFLOW_STEPS)[number]["id"];

export function resolveProfessionalWorkflowStep(
  value: string | undefined,
): ProfessionalWorkflowStepId {
  return PROFESSIONAL_WORKFLOW_STEPS.some((step) => step.id === value)
    ? (value as ProfessionalWorkflowStepId)
    : "cadastro";
}

export function professionalWorkflowStepHref(
  professionalId: string,
  step: ProfessionalWorkflowStepId,
) {
  return `/admin/profissionais/${professionalId}?etapa=${step}`;
}
