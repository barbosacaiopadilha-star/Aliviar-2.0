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
export type SubcriterionGroup = CruzamentoCriterion;

export const SUBCRITERION_GROUPS: readonly SubcriterionGroup[] = [
  ...TECHNICAL_CRITERIA,
  ...PATIENT_CRITERIA,
];

export const SUBCRITERION_GROUP_LABELS = CRITERION_LABELS;

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
 * O catálogo do Método.
 *
 * Em FORMAÇÃO os códigos reaproveitam o enum `curadoria.education_kind`, que
 * já é a taxonomia oficial da formação no cadastro do profissional
 * (`professional_education_entries`). Inventar "graduação/residência médica"
 * ao lado de `graduacao/residencia` criaria dois nomes para a mesma coisa
 * justamente onde os dois lados vão precisar se encontrar.
 *
 * Nos outros cinco grupos não existia lista oficial. Esta é conservadora e
 * feita para crescer: acrescentar subcritério é acrescentar linha; tirar de
 * circulação é `active = false`, nunca DELETE.
 */
export const SUBCRITERION_CATALOG: readonly Subcriterion[] = [
  // ---- Formação Profissional -----------------------------------------------
  s("FORMACAO", "FORMACAO_GRADUACAO", "Graduação", "Onde e quando se formou em medicina.", 1),
  s("FORMACAO", "FORMACAO_RESIDENCIA", "Residência médica", "Residência concluída na especialidade em questão.", 2),
  s("FORMACAO", "FORMACAO_ESPECIALIZACAO", "Especialização", "Título de especialista ou especialização formal na área.", 3),
  s("FORMACAO", "FORMACAO_FELLOWSHIP", "Fellowship", "Formação avançada em subárea, no país ou fora.", 4),
  s("FORMACAO", "FORMACAO_COMPLEMENTAR", "Formação complementar", "Pós-graduação e cursos relevantes para este caso.", 5),

  // ---- Experiência Profissional --------------------------------------------
  s("EXPERIENCIA", "EXPERIENCIA_TEMPO_DE_PRATICA", "Tempo de prática", "Há quanto tempo atua na especialidade.", 1),
  s("EXPERIENCIA", "EXPERIENCIA_CASOS_SEMELHANTES", "Casos semelhantes", "Experiência com situações parecidas com a desta pessoa.", 2),
  s("EXPERIENCIA", "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO", "Condição ou procedimento", "Experiência específica na condição ou no procedimento em questão.", 3),
  s("EXPERIENCIA", "EXPERIENCIA_VOLUME_DE_ATUACAO", "Volume de atuação", "Com que frequência atende esse tipo de caso.", 4),

  // ---- Histórico Profissional ----------------------------------------------
  s("HISTORICO", "HISTORICO_REGULARIDADE", "Regularidade profissional", "Registro regular no conselho, sem pendência em aberto.", 1),
  s("HISTORICO", "HISTORICO_TRAJETORIA_INSTITUCIONAL", "Trajetória institucional", "Serviços e instituições em que atuou.", 2),
  s("HISTORICO", "HISTORICO_PRODUCAO_ACADEMICA", "Produção acadêmica", "Publicação e produção científica na área.", 3),
  s("HISTORICO", "HISTORICO_ENSINO_E_PESQUISA", "Ensino e pesquisa", "Participação em ensino, pesquisa ou formação de outros profissionais.", 4),

  // ---- Acesso ---------------------------------------------------------------
  s("ACESSO", "ACESSO_LOCALIZACAO", "Localização", "Onde atende, e o quanto isso pesa no deslocamento.", 1),
  s("ACESSO", "ACESSO_MODALIDADE", "Modalidade de atendimento", "Presencial, remoto ou os dois.", 2),
  s("ACESSO", "ACESSO_DISPONIBILIDADE", "Disponibilidade", "Horários e janelas em que consegue atender.", 3),
  s("ACESSO", "ACESSO_PRAZO_PARA_CONSULTA", "Prazo para a consulta", "Quanto tempo até conseguir ser atendido.", 4),

  // ---- Continuidade do Cuidado ---------------------------------------------
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_RETORNOS", "Retornos", "Como e com que frequência acontecem os retornos.", 1),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_POS_PROCEDIMENTO", "Acompanhamento pós-procedimento", "O que acontece depois do procedimento, e por quanto tempo.", 2),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_EQUIPE_DE_APOIO", "Equipe de apoio", "Existência de equipe que acompanha junto com o profissional.", 3),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_COORDENACAO", "Coordenação com outros profissionais", "Como conversa com os outros profissionais que cuidam da pessoa.", 4),

  // ---- Modelo de Atendimento -----------------------------------------------
  s("MODELO_DE_ATENDIMENTO", "MODELO_COMUNICACAO", "Comunicação", "Como explica, e o quanto se faz entender.", 1),
  s("MODELO_DE_ATENDIMENTO", "MODELO_DECISAO_COMPARTILHADA", "Decisão compartilhada", "O quanto decide junto com a pessoa, e não por ela.", 2),
  s("MODELO_DE_ATENDIMENTO", "MODELO_PARTICIPACAO_FAMILIAR", "Participação da família", "Abertura para a família participar das conversas.", 3),
  s("MODELO_DE_ATENDIMENTO", "MODELO_ALTERNATIVAS", "Explicação de alternativas", "Se apresenta os caminhos possíveis, inclusive o de não intervir.", 4),
  s("MODELO_DE_ATENDIMENTO", "MODELO_PREFERENCIAS_E_RESTRICOES", "Preferências e restrições", "Como acolhe o que a pessoa quer e o que ela não aceita.", 5),
];

function s(
  group: SubcriterionGroup,
  code: string,
  name: string,
  description: string,
  displayOrder: number,
): Subcriterion {
  return { group, code, name, description, displayOrder, active: true };
}

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
