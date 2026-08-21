/**
 * QUATRO ETAPAS, NÃO SEIS (fusão de 21/08, decidida pelo Fundador).
 *
 * As seis etapas dividiam a mesma máquina em duas e o mesmo assunto em dois:
 *
 * - "Publicação" e "Ciclo de vida" eram duas telas para UMA máquina — o
 *   próprio banco diz que publicar/despublicar É mudança de ciclo
 *   ("status e publication_status apenas a espelham"). Viraram "Rede":
 *   o estado do profissional na Rede, com verificações, motivo e autoria.
 * - "Cadastro" e "Documentos e formação" eram o mesmo assunto — quem ele é,
 *   e as provas de quem ele é. Viraram uma etapa com duas seções.
 *
 * "Mapa" e "Protocolo" ficam separados de propósito: o Mapa pelo peso (35
 * subcritérios — fundido, viraria rolagem infinita) e o Protocolo pela
 * autoria (a voz do médico, colhida em entrevista — ADR-074). Os dois serão
 * redesenhados como roteiro de entrevista no descongelamento; fundi-los
 * agora seria retrabalho certo.
 */
export const PROFESSIONAL_WORKFLOW_STEPS = [
  { id: "cadastro", label: "Cadastro" },
  // O `id` continua `rede` porque é identificador de rota, e endereço em uso
  // não se troca por questão de nome. O rótulo acompanha o conteúdo novo.
  { id: "rede", label: "Rede" },
  { id: "protocolo", label: "Protocolo" },
  { id: "mapa", label: "Mapa" },
] as const;

export type ProfessionalWorkflowStepId =
  (typeof PROFESSIONAL_WORKFLOW_STEPS)[number]["id"];

/**
 * Endereços das etapas extintas continuam chegando ao lugar certo: links
 * salvos, `revalidatePath` antigos e abas abertas não podem virar 404 nem
 * cair silenciosamente no Cadastro errado.
 */
export const LEGACY_WORKFLOW_STEPS: Record<string, ProfessionalWorkflowStepId> = {
  publicacao: "rede",
  documentos: "cadastro",
};

export function resolveProfessionalWorkflowStep(
  value: string | undefined,
): ProfessionalWorkflowStepId {
  if (PROFESSIONAL_WORKFLOW_STEPS.some((step) => step.id === value)) {
    return value as ProfessionalWorkflowStepId;
  }
  if (value && value in LEGACY_WORKFLOW_STEPS) {
    return LEGACY_WORKFLOW_STEPS[value]!;
  }
  return "cadastro";
}

export function professionalWorkflowStepHref(
  professionalId: string,
  step: ProfessionalWorkflowStepId,
) {
  // A etapa vive no CAMINHO, não na query: com `?etapa=`, as etapas eram a
  // mesma rota e o roteador tratava a troca como navegação já satisfeita —
  // a URL não mudava e a tela ficava parada.
  return `/admin/profissionais/${professionalId}/${step}`;
}
