import {
  COMPETENCY_DOMAIN_LABELS,
  INTAKE_APPROACH_LABELS,
} from "@/modules/profiles/professional-schema";

import {
  COMPETENCY_DOMAINS,
  CRITERIA_REQUIRING_TARGET,
  INTAKE_APPROACHES,
  type PriorityCriterion,
} from "./types";

/**
 * O ALVO DECLARADO — o que o paciente escolheu, para os critérios em que
 * "mais" não é automaticamente "melhor".
 *
 * @metodo Ontologia §3.6 — peso é importância atribuída pelo paciente, nunca qualidade de médico
 * @metodo Engine §5.2 — o Motor de Pesos nunca sugere valor
 *
 * Por que existe: três critérios não são monotônicos. Experiência tem direção
 * ("mais é melhor"); região, área e forma do primeiro encontro não têm — elas
 * dependem do que ESTA pessoa quer. Sem o alvo, o Motor não tem contra o que
 * comparar, e a Invariante I-04 bloqueia a validação do Perfil.
 *
 * A consequência disso em produção foi grave e silenciosa: o Motor exigia o
 * alvo, a tela não tinha campo para ele, e quem escolhesse um desses três
 * critérios ficava impedido de validar — para sempre, sem mensagem que
 * explicasse o caminho de saída.
 *
 * Por que opção fechada e não texto livre: a comparação é por igualdade exata
 * (`provider.crmUf === target`, `intakeApproach === target`, `hasDomain(...)`).
 * Um campo livre aceitaria "São Paulo" onde o Motor espera "SP" — e o
 * resultado não seria um erro, seria um alinhamento zero silencioso, que
 * ninguém saberia explicar depois.
 *
 * Os rótulos vêm de `professional-schema`: são os mesmos que descrevem o
 * profissional. Duas listas de rótulos para o mesmo valor divergiriam.
 */

export type PriorityTargetOption = { value: string; label: string };

/** Unidades da federação — o alvo de LOCALIZACAO é comparado com `crm_uf`. */
export const UF_OPTIONS: PriorityTargetOption[] = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
].map(([value, label]) => ({ value: value!, label: `${label} (${value})` }));

/**
 * As opções válidas de alvo, por critério. Critério fora deste mapa não pede
 * alvo — e a tela não deve inventar um campo para ele.
 */
export const PRIORITY_TARGET_OPTIONS: Partial<Record<PriorityCriterion, PriorityTargetOption[]>> = {
  AREA_DE_ATUACAO: COMPETENCY_DOMAINS
    // "não determinado" descreve um cadastro incompleto do profissional; não é
    // algo que um paciente escolhe como prioridade.
    .filter((domain) => domain !== "nao_determinado")
    .map((domain) => ({ value: domain, label: COMPETENCY_DOMAIN_LABELS[domain] })),

  ABORDAGEM_INICIAL: INTAKE_APPROACHES
    // "se adapta a ambos" é uma qualidade do profissional, não uma preferência
    // do paciente — ele quer uma forma, e quem se adapta atende a qualquer uma.
    .filter((approach) => approach !== "ambos")
    .map((approach) => ({ value: approach, label: INTAKE_APPROACH_LABELS[approach] })),

  LOCALIZACAO: UF_OPTIONS,
};

/** A pergunta que o Curador faz para descobrir o alvo. Nunca sugere resposta. */
export const PRIORITY_TARGET_QUESTIONS: Partial<Record<PriorityCriterion, string>> = {
  AREA_DE_ATUACAO: "Qual área ela priorizou?",
  ABORDAGEM_INICIAL: "Como ela prefere que seja o primeiro encontro?",
  LOCALIZACAO: "Em que estado ela quer ser atendida?",
};

export function requiresTarget(criterion: PriorityCriterion): boolean {
  return CRITERIA_REQUIRING_TARGET.includes(criterion);
}

/** O rótulo humano de um alvo já gravado — para a tela nunca mostrar o valor cru. */
export function targetLabel(criterion: PriorityCriterion, value: string | null): string | null {
  if (!value) return null;
  const found = PRIORITY_TARGET_OPTIONS[criterion]?.find((option) => option.value === value);
  return found?.label ?? value;
}
