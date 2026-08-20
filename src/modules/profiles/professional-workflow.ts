export const PROFESSIONAL_WORKFLOW_STEPS = [
  { id: "cadastro", label: "Cadastro" },
  { id: "publicacao", label: "Publicação" },
  // A aba dizia "Rede", o painel dentro dela dizia "Ciclo de vida" e o link da
  // lista também — três nomes para o mesmo passo. Quem manda é o conteúdo, que
  // trata de estado na Rede, motivo e autoria: ciclo de vida. O `id` continua
  // `rede` porque é identificador de rota, e endereço em uso não se troca por
  // questão de nome.
  { id: "rede", label: "Ciclo de vida" },
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
  // A etapa vive no CAMINHO, não na query: com `?etapa=`, as seis eram a
  // mesma rota e o roteador tratava a troca como navegação já satisfeita —
  // a URL não mudava e a tela ficava parada.
  return `/admin/profissionais/${professionalId}/${step}`;
}
