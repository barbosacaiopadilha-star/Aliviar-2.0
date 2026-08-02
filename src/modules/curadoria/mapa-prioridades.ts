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
// CATÁLOGO 1.0.0 — espelho exato da migration
// 20260802100000_catalogo_canonico_1_0_0.sql. A fonte da verdade é o banco
// (`listSubcriterionCatalog`); esta lista existe apenas como default de
// funções puras e DEVE permanecer idêntica à migration — o teste de
// mapa-prioridades trava os 28 códigos.
export const SUBCRITERION_CATALOG: readonly Subcriterion[] = [
  // ---- Formação (Prática e Trajetória) -------------------------------------
  s("FORMACAO", "FORMACAO_GRADUACAO", "Graduação", "Onde e quando se formou em medicina.", 1),
  s("FORMACAO", "FORMACAO_RESIDENCIA", "Residência médica", "Residência concluída na especialidade em questão.", 2),
  s("FORMACAO", "FORMACAO_ESPECIALIZACAO", "Especialização", "Título de especialista ou especialização formal na área.", 3),
  s("FORMACAO", "FORMACAO_FELLOWSHIP", "Fellowship", "Formação avançada em subárea, no país ou fora.", 4),
  s("FORMACAO", "FORMACAO_COMPLEMENTAR", "Formação complementar", "Pós-graduação e cursos relevantes.", 5),

  // ---- Experiência (Prática e Trajetória) ----------------------------------
  s("EXPERIENCIA", "EXPERIENCIA_TEMPO_DE_PRATICA", "Tempo de prática", "Há quanto tempo atua na especialidade.", 1),
  s("EXPERIENCIA", "EXPERIENCIA_VOLUME_DE_ATUACAO", "Volume de atuação", "Com que frequência atende esse tipo de caso.", 4),
  s("EXPERIENCIA", "EXPERIENCIA_NO_TIPO_DE_CASO", "Experiência no tipo de caso", "Experiência na condição/procedimento e em casos semelhantes. Fusão de EXPERIENCIA_CASOS_SEMELHANTES e EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO.", 5),
  s("EXPERIENCIA", "PRATICA_LIMITES_DE_ATUACAO", "Limites de atuação", "O que o profissional NÃO atende e quando encaminha. É a Área de Atuação em negativo, e alimenta o filtro eliminatório da Curadoria.", 6),

  // ---- Histórico (Prática e Trajetória) ------------------------------------
  s("HISTORICO", "HISTORICO_TRAJETORIA_INSTITUCIONAL", "Trajetória institucional", "Serviços e instituições em que atuou.", 2),
  s("HISTORICO", "HISTORICO_ATIVIDADE_ACADEMICA", "Atividade acadêmica", "Produção científica, ensino e formação de outros. Fusão de HISTORICO_PRODUCAO_ACADEMICA e HISTORICO_ENSINO_E_PESQUISA.", 5),
  s("HISTORICO", "HISTORICO_AREAS_DE_ATUACAO", "Áreas de atuação", "Áreas em que atua hoje. Formalização de professional_practice_areas como conceito do catálogo.", 6),

  // ---- Acesso ao Cuidado ----------------------------------------------------
  s("ACESSO", "ACESSO_MODALIDADE", "Modalidade de atendimento", "Presencial, remoto ou os dois.", 2),
  s("ACESSO", "ACESSO_DISPONIBILIDADE", "Disponibilidade", "Horários e janelas em que consegue atender.", 3),
  s("ACESSO", "ACESSO_PRAZO_PARA_CONSULTA", "Prazo para a primeira consulta", "Quanto tempo até conseguir ser atendido.", 4),
  s("ACESSO", "ACESSO_LOCAL_DE_ATENDIMENTO", "Local de atendimento", "Onde o profissional atende presencialmente. Substitui ACESSO_LOCALIZACAO.", 5),

  // ---- Continuidade do Cuidado ---------------------------------------------
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_RETORNOS", "Retornos", "Como e com que frequência acontecem os retornos.", 1),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_POS_PROCEDIMENTO", "Acompanhamento pós-procedimento", "O que acontece depois do procedimento, e por quanto tempo.", 2),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_EQUIPE_DE_APOIO", "Equipe de apoio", "Existência de equipe que acompanha junto com o profissional.", 3),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_COORDENACAO", "Coordenação com outros profissionais", "Como conversa com os outros profissionais que cuidam da pessoa.", 4),
  s("CONTINUIDADE_DO_CUIDADO", "CONTINUIDADE_CANAIS", "Canais entre consultas", "Por onde e em que condições a pessoa pode falar com o profissional ou a equipe entre consultas.", 5),

  // ---- Modelo de Atendimento -----------------------------------------------
  s("MODELO_DE_ATENDIMENTO", "MODELO_COMUNICACAO", "Como explica", "Condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento.", 1),
  s("MODELO_DE_ATENDIMENTO", "MODELO_DECISAO_COMPARTILHADA", "Como conduz decisões", "Condutas observáveis diante de mais de uma alternativa adequada.", 2),
  s("MODELO_DE_ATENDIMENTO", "MODELO_PARTICIPACAO_FAMILIAR", "Participação de acompanhantes", "Abertura e condições para a presença de acompanhantes.", 3),
  s("MODELO_DE_ATENDIMENTO", "MODELO_ALTERNATIVAS", "Explicação de alternativas", "Se apresenta os caminhos possíveis, inclusive o de não intervir.", 4),
  s("MODELO_DE_ATENDIMENTO", "MODELO_PREFERENCIAS_E_RESTRICOES", "Respeito a recusas e restrições", "Como o profissional lida com recusas explícitas e restrições pessoais, religiosas ou culturais.", 5),

  // ---- Viabilidade de Acesso (fora da matriz do Motor) ---------------------
  s("VIABILIDADE", "VIABILIDADE_COBERTURA_E_CONVENIO", "Cobertura e convênio", "Por quais formas de cobertura o profissional atende, e o que a pessoa precisa usar. Sinaliza; nunca elimina nem ranqueia.", 1),
  s("VIABILIDADE", "VIABILIDADE_CUSTO_E_PAGAMENTO", "Custo e pagamento", "O custo declarado do atendimento e as formas de pagá-lo. Proibido ordenar por preço (ADR-041).", 2),
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
