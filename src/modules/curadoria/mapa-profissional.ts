/**
 * MAPA DO PROFISSIONAL — a característica está presente, ou não está.
 *
 * @metodo Modelo v1.0 §4 e §6 — os seis critérios são canônicos
 * @metodo Política de Fontes — ausência de informação é dita, nunca convertida
 *
 * Os dois lados falam do MESMO subcritério, com naturezas diferentes:
 *
 *   Case         → quanto isto importa    (importância, cinco níveis)
 *   Profissional → isto está presente?    (estado, três valores)
 *
 * O profissional nunca recebe peso, nota ou importância. Não existe
 * "excelente", "muito bom", "especialista de alto nível" — adjetivo de
 * qualidade aqui seria a Aliviar opinando sobre gente, e o Método não faz
 * isso. Existe apenas: confirmado, não confirmado, não informado.
 *
 * A simplicidade é deliberada. Estados intermediários ("parcial", "provável",
 * "evidência forte") parecem mais precisos e são menos: cada um deles vira
 * uma decisão disfarçada de medida.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import {
  activeSubcriteria,
  SUBCRITERION_CATALOG,
  SUBCRITERION_GROUPS,
  SUBCRITERION_GROUP_LABELS,
  subcriteriaOfGroup,
  type Subcriterion,
  type SubcriterionGroup,
} from "./mapa-prioridades";

// ---------------------------------------------------------------------------
// Os três estados
// ---------------------------------------------------------------------------

export const SUBCRITERION_STATUSES = ["CONFIRMADO", "NAO_CONFIRMADO", "NAO_INFORMADO"] as const;

export type SubcriterionStatus = (typeof SUBCRITERION_STATUSES)[number];

export const SUBCRITERION_STATUS_LABELS: Record<SubcriterionStatus, string> = {
  CONFIRMADO: "Confirmado",
  NAO_CONFIRMADO: "Não confirmado",
  NAO_INFORMADO: "Não informado",
};

/**
 * O que cada estado afirma — em uma frase, para que ninguém precise adivinhar
 * ao preencher.
 */
export const SUBCRITERION_STATUS_MEANING: Record<SubcriterionStatus, string> = {
  CONFIRMADO: "A característica está presente, segundo o que a operação registrou.",
  NAO_CONFIRMADO: "A operação verificou: não está presente, não é oferecida ou não se aplica.",
  NAO_INFORMADO: "Não há informação suficiente para afirmar presença nem ausência.",
};

export function isSubcriterionStatus(value: string): value is SubcriterionStatus {
  return (SUBCRITERION_STATUSES as readonly string[]).includes(value);
}

/** Observação é curta de propósito: é apoio à leitura, não laudo. */
export const NOTE_MAX_LENGTH = 280;

/**
 * Vazio e só-espaço viram `null`. Uma observação em branco não é uma
 * observação — guardá-la como string faria a tela mostrar um campo
 * "preenchido" que não diz nada.
 */
export function normalizeNote(note: string | null | undefined): string | null {
  const limpo = (note ?? "").trim();
  return limpo.length === 0 ? null : limpo;
}

// ---------------------------------------------------------------------------
// O mapa
// ---------------------------------------------------------------------------

export type ProfessionalMapItem = {
  subcriterionCode: string;
  status: SubcriterionStatus;
  note: string | null;
  /**
   * PP-02 — quem declarou este estado. `null` significa **registro anterior ao
   * regime de autoria**, nunca "autor desconhecido" e nunca ausência de
   * responsabilidade (I-8).
   *
   * Desde `20260819230000_mapa_exige_autor`, toda gravação NOVA preenche este
   * campo com o ator da sessão, e o banco recusa linha nova sem ele. Os `null`
   * que restarem são anteriores a essa data — e ficam assim de propósito:
   * escolher um assinante retroativo falsificaria autoria sobre um médico
   * real.
   */
  declaredBy?: string | null;
  /** Nome de quem declarou, quando resolvível. Só apresentação. */
  declaredByName?: string | null;
  /** Etapa 1: `updated_at` — quando o registro foi gravado. Mesma semantica do lado do Case. */
  registradoEm?: string | null;
};

export type ProfessionalMapCompletion = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
  total: number;
  /** Subcritérios ativos com declaração — inclusive `NAO_INFORMADO`. */
  declared: number;
  /** Subcritérios ativos SEM registro nenhum. */
  pending: number;
  pendingCodes: string[];
};

/**
 * Completude significa que todos foram TRATADOS, não que todos foram
 * atendidos. `NAO_INFORMADO` conta como tratado: alguém olhou e disse que
 * não sabe — o que é uma informação, e diferente de ninguém ter olhado.
 *
 * Ausência de registro nunca vira `NAO_INFORMADO`. As duas situações podem
 * ter o mesmo efeito no motor um dia, mas aqui são fatos distintos: "item
 * ainda não trabalhado" e "item analisado, sem informação".
 */
export function professionalMapCompletion(
  items: readonly ProfessionalMapItem[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): ProfessionalMapCompletion {
  const ativos = activeSubcriteria(catalog);
  const declarados = new Set(items.map((item) => item.subcriterionCode));

  const pendingCodes = ativos
    .filter((entry) => !declarados.has(entry.code))
    .sort((a, b) =>
      a.group === b.group
        ? a.displayOrder - b.displayOrder
        : SUBCRITERION_GROUPS.indexOf(a.group) - SUBCRITERION_GROUPS.indexOf(b.group),
    )
    .map((entry) => entry.code);

  const total = ativos.length;
  const declared = total - pendingCodes.length;

  return {
    status: declared === 0 ? "NOT_STARTED" : pendingCodes.length === 0 ? "COMPLETE" : "IN_PROGRESS",
    total,
    declared,
    pending: pendingCodes.length,
    pendingCodes,
  };
}

/**
 * A frase do resumo.
 *
 * "não informados" seria ambíguo: colide com o estado `NAO_INFORMADO`. Quem
 * lê precisa distinguir "ninguém olhou ainda" de "olharam e não souberam".
 */
export function completionSentence(completion: ProfessionalMapCompletion): string {
  if (completion.total === 0) return "Nenhum subcritério em circulação.";
  if (completion.pending === 0) return `${completion.total} de ${completion.total} tratados.`;
  return `${completion.declared} de ${completion.total} tratados · ${completion.pending} ainda não avaliado${
    completion.pending === 1 ? "" : "s"
  }.`;
}

export type ProfessionalMapGroup = {
  group: SubcriterionGroup;
  label: string;
  entries: {
    subcriterion: Subcriterion;
    /** `null` = ninguém tratou ainda. Nunca confundir com `NAO_INFORMADO`. */
    status: SubcriterionStatus | null;
    note: string | null;
    /** Quem assinou esta declaração, e quando — para a tela dizer QUEM. */
    declaredByName: string | null;
    registradoEm: string | null;
  }[];
};

export function groupProfessionalMap(
  items: readonly ProfessionalMapItem[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): ProfessionalMapGroup[] {
  const porCodigo = new Map(items.map((item) => [item.subcriterionCode, item]));

  return SUBCRITERION_GROUPS.map((group) => ({
    group,
    label: SUBCRITERION_GROUP_LABELS[group],
    entries: subcriteriaOfGroup(group, catalog)
      .filter((entry) => entry.active)
      .map((subcriterion) => {
        const declarado = porCodigo.get(subcriterion.code);
        return {
          subcriterion,
          status: declarado?.status ?? null,
          note: declarado?.note ?? null,
          declaredByName: declarado?.declaredByName ?? null,
          registradoEm: declarado?.registradoEm ?? null,
        };
      }),
  }));
}

// ---------------------------------------------------------------------------
// O que o domínio recusa antes do banco
// ---------------------------------------------------------------------------

export type ProfessionalMapRejection =
  | { reason: "SUBCRITERIO_INEXISTENTE"; code: string }
  | { reason: "SUBCRITERIO_INATIVO"; code: string }
  | { reason: "ESTADO_INVALIDO"; value: string }
  | { reason: "SUBCRITERIO_REPETIDO"; code: string }
  | { reason: "OBSERVACAO_LONGA"; code: string; length: number };

export function validateProfessionalMapWrite(
  entries: readonly { subcriterionCode: string; status: string; note?: string | null }[],
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): ProfessionalMapRejection[] {
  const porCodigo = new Map(catalog.map((entry) => [entry.code, entry]));
  const vistos = new Set<string>();
  const rejeicoes: ProfessionalMapRejection[] = [];

  for (const entry of entries) {
    const subcriterion = porCodigo.get(entry.subcriterionCode);

    if (!subcriterion) {
      rejeicoes.push({ reason: "SUBCRITERIO_INEXISTENTE", code: entry.subcriterionCode });
    } else if (!subcriterion.active) {
      rejeicoes.push({ reason: "SUBCRITERIO_INATIVO", code: entry.subcriterionCode });
    }

    if (!isSubcriterionStatus(entry.status)) {
      rejeicoes.push({ reason: "ESTADO_INVALIDO", value: entry.status });
    }

    const nota = normalizeNote(entry.note);
    if (nota && nota.length > NOTE_MAX_LENGTH) {
      rejeicoes.push({
        reason: "OBSERVACAO_LONGA",
        code: entry.subcriterionCode,
        length: nota.length,
      });
    }

    if (vistos.has(entry.subcriterionCode)) {
      rejeicoes.push({ reason: "SUBCRITERIO_REPETIDO", code: entry.subcriterionCode });
    }
    vistos.add(entry.subcriterionCode);
  }

  return rejeicoes;
}

/**
 * A mensagem que a tela mostra. Diz o item, a regra e o que fazer — nunca
 * "Dados inválidos", que não ajuda ninguém a consertar nada.
 */
export function describeRejection(
  rejection: ProfessionalMapRejection,
  catalog: readonly Subcriterion[] = SUBCRITERION_CATALOG,
): string {
  const nome = (code: string) =>
    catalog.find((entry) => entry.code === code)?.name ?? code;

  switch (rejection.reason) {
    case "SUBCRITERIO_INEXISTENTE":
      return `"${rejection.code}" não existe no catálogo do Método. Recarregue a página: o catálogo pode ter mudado.`;
    case "SUBCRITERIO_INATIVO":
      return `${nome(rejection.code)} saiu de circulação e não recebe declaração nova. O que já estava registrado continua valendo.`;
    case "ESTADO_INVALIDO":
      return `"${rejection.value}" não é um estado do Método. Escolha entre Confirmado, Não confirmado e Não informado.`;
    case "SUBCRITERIO_REPETIDO":
      return `${nome(rejection.code)} aparece duas vezes na mesma gravação. Deixe uma só.`;
    case "OBSERVACAO_LONGA":
      return `A observação de ${nome(rejection.code)} tem ${rejection.length} caracteres. O limite é ${NOTE_MAX_LENGTH} — a observação é apoio à leitura, não laudo.`;
  }
}
