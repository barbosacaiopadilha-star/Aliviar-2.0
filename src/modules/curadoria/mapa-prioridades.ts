/**
 * MAPA DE PRIORIDADES DO CASE — o Método define o que se avalia; o Case
 * define quanto cada coisa importa.
 *
 * @metodo Modelo v1.0 §4 e §6 — os seis critérios são canônicos
 * @metodo Fundamentos §13 — P14: o Curador declara; o sistema organiza
 *
 * Por que existe: até aqui o Curador escolhia um critério de uma lista legada
 * e digitava um `target_value` e uma `evidence` em texto livre. Duas
 * consequências: o vocabulário do Método virava prosa, e cada Case descrevia
 * a mesma coisa com palavras diferentes — nada comparável, nada agregável.
 *
 * Aqui o vocabulário é fechado nos dois níveis: os seis critérios do Modelo
 * v1.0 (reaproveitados, não redefinidos) e um catálogo de subcritérios. O
 * Curador não cria, não renomeia, não descreve — ele diz **quanto importa**,
 * numa escala de cinco níveis.
 *
 * O que este módulo NUNCA faz: pontuar profissional, comparar, ordenar ou
 * decidir. Ele só representa o que a pessoa declarou como importante.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { CATALOGO_GERADO } from "./catalogo-gerado";
import { CRITERION_LABELS, PATIENT_CRITERIA, TECHNICAL_CRITERIA, type CruzamentoCriterion } from "./cruzamento";

// ---------------------------------------------------------------------------
// Grupos — os seis critérios do Modelo v1.0, sem vocabulário paralelo
// ---------------------------------------------------------------------------

/**
 * O grupo de um subcritério É um critério do Modelo v1.0.
 *
 * Decisão deliberada: nenhum tipo novo de "grupo". Criar
 * `historico_profissional` ao lado de `HISTORICO`, ou `continuidade_cuidado`
 * ao lado de `CONTINUIDADE_DO_CUIDADO`, produziria dois vocabulários para a
 * mesma coisa — que é exatamente o problema que este modelo veio resolver.
 */
export type SubcriterionGroup = CruzamentoCriterion | "VIABILIDADE";

export const SUBCRITERION_GROUPS: readonly SubcriterionGroup[] = [
  ...TECHNICAL_CRITERIA,
  ...PATIENT_CRITERIA,
  // Catálogo 1.0.0 (decisão de Método de 2026-07-31): viabilidade de acesso
  // entra no Mapa — a pessoa declara grau — mas NUNCA na matriz do Motor.
  // Por isso o grupo existe aqui e não em CruzamentoCriterion: adicioná-lo lá
  // faria custo e convênio virarem célula de comparação, que a ADR-041
  // proíbe (ordenação por preço é ranking).
  "VIABILIDADE",
];

export const SUBCRITERION_GROUP_LABELS: Record<SubcriterionGroup, string> = {
  ...CRITERION_LABELS,
  VIABILIDADE: "Viabilidade de acesso",
};

export function isSubcriterionGroup(value: string): value is SubcriterionGroup {
  return (SUBCRITERION_GROUPS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Escala de importância — cinco níveis, sem meio-termo
// ---------------------------------------------------------------------------

export const IMPORTANCE_LEVELS = [
  "MUITO_IMPORTANTE",
  "IMPORTANTE",
  "RELEVANTE",
  "POUCO_IMPORTANTE",
  "NAO_INFLUENCIA",
] as const;

export type ImportanceLevel = (typeof IMPORTANCE_LEVELS)[number];

export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  MUITO_IMPORTANTE: "Muito importante",
  IMPORTANTE: "Importante",
  RELEVANTE: "Relevante",
  POUCO_IMPORTANTE: "Pouco importante",
  NAO_INFLUENCIA: "Não influencia este caso",
};

/**
 * O ordinal é DERIVADO, nunca a fonte.
 *
 * O dado do domínio é o nível — a palavra que a pessoa reconheceria se
 * ouvisse de volta. O número existe só para ordenar e, no futuro, para
 * alimentar cálculo. Fica aqui, num lugar só, para que nenhum número mágico
 * apareça espalhado pelo código.
 */
const IMPORTANCE_ORDINALS: Record<ImportanceLevel, number> = {
  MUITO_IMPORTANTE: 5,
  IMPORTANTE: 4,
  RELEVANTE: 3,
  POUCO_IMPORTANTE: 2,
  NAO_INFLUENCIA: 0,
};

export function importanceOrdinal(level: ImportanceLevel): number {
  return IMPORTANCE_ORDINALS[level];
}

export function isImportanceLevel(value: string): value is ImportanceLevel {
  return (IMPORTANCE_LEVELS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// O catálogo canônico
// ---------------------------------------------------------------------------

export type Subcriterion = {
  /** Código estável. NUNCA derivado do texto visível — o rótulo pode mudar. */
  code: string;
  group: SubcriterionGroup;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
};

/**
 * O catálogo do Método — DERIVADO do arquivo gerado, nunca mantido à mão.
 *
 * A lista manual que vivia aqui era uma das QUATRO fontes da verdade que a
 * auditoria encontrou divergindo (AUDITORIA_01 §3.1). Agora ela é adapter:
 * `catalogo-gerado.ts` é emitido do banco (`scripts/gerar-catalogo-ts.mjs`) e
 * travado por hash no gate de paridade. A fonte em tempo de execução continua
 * sendo o banco (`listSubcriterionCatalog`); esta constante existe como
 * default de funções puras — e agora é, por construção, o MESMO catálogo.
 *
 * Só os 28 ativos: o legado 0.9.0 inativo chega pelas leituras do banco
 * (includeInactive) para o histórico; mantê-lo fora daqui preserva o
 * comportamento de todas as superfícies que listam o catálogo vigente.
 */
export const SUBCRITERION_CATALOG: readonly Subcriterion[] = CATALOGO_GERADO.filter(
  (entry) => entry.active,
).map((entry) => {
  if (!isSubcriterionGroup(entry.group)) {
    // Guarda de construção: grupo fora do vocabulário do Modelo v1.0 é
    // catálogo e domínio divergindo — erro de migration, não de dado.
    throw new Error(`Subcritério "${entry.code}" declara grupo desconhecido: ${entry.group}.`);
  }
  return {
    code: entry.code,
    group: entry.group,
    name: entry.name,
    description: entry.description,
    displayOrder: entry.displayOrder,
    active: entry.active,
  };
});

/** Só os que estão em circulação — a fonte de qualquer contagem. */
export function activeSubcriteria(
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): Subcriterion[] {
  return catalog.filter((entry) => entry.active);
}

export function subcriteriaOfGroup(
  group: SubcriterionGroup,
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): Subcriterion[] {
  return catalog
    .filter((entry) => entry.group === group)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

// ---------------------------------------------------------------------------
// O mapa de um Case
// ---------------------------------------------------------------------------

export type PriorityMapItem = {
  subcriterionCode: string;
  importance: ImportanceLevel;
  /**
   * PP-02 — quem declarou esta importância. `null` significa **registro
   * anterior ao regime de autoria**, nunca "autor desconhecido" e nunca
   * ausência de responsabilidade (I-8).
   *
   * Infraestrutura: a coluna existe e é lida; **nenhuma escrita a preenche
   * ainda**, e nenhum consumidor a usa. Quem passará a gravá-la é o pacote da
   * confirmação (Itens 1.9/1.10), sob a ADR-068.
   */
  declaredBy?: string | null;
  /** PP-02/Etapa 1: `updated_at` — quando o registro foi gravado. Nao e "data da confirmacao": essa coluna nao existe, e inventa-la seria afirmar precisao que o banco nao tem. */
  registradoEm?: string | null;
};

export type CompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type PriorityMapCompletion = {
  status: CompletionStatus;
  total: number;
  completed: number;
  pending: number;
  /** Códigos ainda sem classificação, na ordem do catálogo. */
  pendingCodes: string[];
};

/**
 * A completude é CALCULADA, nunca declarada.
 *
 * Não existe "Validar Critérios" no novo modelo: validar era um ato manual
 * que dizia, em outro lugar, algo que os próprios dados já dizem. Um mapa
 * está completo quando todo subcritério ativo tem um nível — e ponto.
 *
 * Classificação de subcritério que saiu de circulação continua no Case e não
 * conta como pendência: o histórico do que foi declarado não se reescreve
 * porque o catálogo mudou depois.
 */
export function priorityMapCompletion(
  items: readonly PriorityMapItem[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): PriorityMapCompletion {
  const ativos = activeSubcriteria(catalog);
  const classificados = new Set(items.map((item) => item.subcriterionCode));

  const pendingCodes = ativos
    .filter((entry) => !classificados.has(entry.code))
    .sort((a, b) =>
      a.group === b.group
        ? a.displayOrder - b.displayOrder
        : SUBCRITERION_GROUPS.indexOf(a.group) - SUBCRITERION_GROUPS.indexOf(b.group),
    )
    .map((entry) => entry.code);

  const total = ativos.length;
  const completed = total - pendingCodes.length;

  return {
    status: completed === 0 ? "NOT_STARTED" : pendingCodes.length === 0 ? "COMPLETE" : "IN_PROGRESS",
    total,
    completed,
    pending: pendingCodes.length,
    pendingCodes,
  };
}

/** O mapa agrupado para leitura — a ordem do Método, não a de inserção. */
export type PriorityMapGroup = {
  group: SubcriterionGroup;
  label: string;
  entries: { subcriterion: Subcriterion; importance: ImportanceLevel | null }[];
};

export function groupPriorityMap(
  items: readonly PriorityMapItem[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): PriorityMapGroup[] {
  const porCodigo = new Map(items.map((item) => [item.subcriterionCode, item.importance]));

  return SUBCRITERION_GROUPS.map((group) => ({
    group,
    label: SUBCRITERION_GROUP_LABELS[group],
    entries: subcriteriaOfGroup(group, catalog)
      .filter((entry) => entry.active)
      .map((subcriterion) => ({
        subcriterion,
        importance: porCodigo.get(subcriterion.code) ?? null,
      })),
  }));
}

// ---------------------------------------------------------------------------
// Validação de escrita — o que o domínio recusa antes do banco
// ---------------------------------------------------------------------------

export type PriorityMapRejection =
  | { reason: "SUBCRITERIO_INEXISTENTE"; code: string }
  | { reason: "SUBCRITERIO_INATIVO"; code: string }
  | { reason: "NIVEL_INVALIDO"; value: string }
  | { reason: "SUBCRITERIO_REPETIDO"; code: string };

/**
 * Recusa antes de chegar ao banco. O banco recusa de novo — as duas travas
 * são de propósito: a de cá dá a mensagem, a de lá dá a garantia.
 */
export function validatePriorityMapWrite(
  entries: readonly { subcriterionCode: string; importance: string }[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): PriorityMapRejection[] {
  const porCodigo = new Map(catalog.map((entry) => [entry.code, entry]));
  const vistos = new Set<string>();
  const rejeicoes: PriorityMapRejection[] = [];

  for (const entry of entries) {
    const subcriterion = porCodigo.get(entry.subcriterionCode);

    if (!subcriterion) {
      rejeicoes.push({ reason: "SUBCRITERIO_INEXISTENTE", code: entry.subcriterionCode });
    } else if (!subcriterion.active) {
      rejeicoes.push({ reason: "SUBCRITERIO_INATIVO", code: entry.subcriterionCode });
    }

    if (!isImportanceLevel(entry.importance)) {
      rejeicoes.push({ reason: "NIVEL_INVALIDO", value: entry.importance });
    }

    if (vistos.has(entry.subcriterionCode)) {
      rejeicoes.push({ reason: "SUBCRITERIO_REPETIDO", code: entry.subcriterionCode });
    }
    vistos.add(entry.subcriterionCode);
  }

  return rejeicoes;
}
