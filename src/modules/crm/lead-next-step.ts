/**
 * Qual é o próximo passo deste lead.
 *
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * Uma única fonte para a fila e para a ficha. Antes de existir, a lista dizia
 * uma coisa e a tela do lead oferecia outra — e o Atendente descobria a
 * divergência clicando.
 *
 * A ordem é a da jornada, e cada estado é derivado de um fato do banco, nunca
 * de um campo de "etapa" que alguém precisa lembrar de atualizar: qualificado
 * é ter `qualifiedAt`; convertido é ter `patientProfileId`; com Case é ter
 * `caseId`. Estado derivado não sai de sincronia.
 */

export type LeadStepKey = "qualificar" | "converter" | "abrir" | "encaminhar" | "concluido";

export type LeadStep = {
  key: LeadStepKey;
  /** Onde o lead está agora. */
  status: string;
  /** O que fazer em seguida — texto do botão. Nunca "Continuar". */
  action: string;
  /** Prioridade na fila: menor vem primeiro. */
  order: number;
};

const STEPS: Record<LeadStepKey, LeadStep> = {
  qualificar: { key: "qualificar", status: "Novo", action: "Qualificar lead", order: 0 },
  converter: { key: "converter", status: "Qualificado", action: "Converter em paciente", order: 0 },
  abrir: { key: "abrir", status: "Convertido em paciente", action: "Abrir atendimento", order: 1 },
  encaminhar: { key: "encaminhar", status: "Case aberto", action: "Encaminhar ao Curador", order: 2 },
  concluido: { key: "concluido", status: "Com o Curador", action: "Acompanhar", order: 3 },
};

export function nextStepForLead(lead: {
  qualifiedAt: string | null;
  patientProfileId: string | null;
  caseId?: string | null;
  handedOff?: boolean;
}): LeadStep {
  if (lead.handedOff) return STEPS.concluido;
  if (lead.caseId) return STEPS.encaminhar;
  if (lead.patientProfileId) return STEPS.abrir;
  if (lead.qualifiedAt) return STEPS.converter;
  return STEPS.qualificar;
}

/**
 * Ordena a fila pelo que falta fazer, não pela data.
 *
 * Um lead que espera qualificação há três dias importa mais que um convertido
 * hoje. Ordenar por data faria o Atendente ler a lista inteira para achar o
 * trabalho — que é justamente o que uma fila deveria evitar.
 */
export function sortLeadQueue<T extends { qualifiedAt: string | null; patientProfileId: string | null; caseId?: string | null; createdAt: string }>(
  leads: readonly T[],
): T[] {
  return [...leads].sort((a, b) => {
    const oa = nextStepForLead(a).order;
    const ob = nextStepForLead(b).order;
    if (oa !== ob) return oa - ob;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
