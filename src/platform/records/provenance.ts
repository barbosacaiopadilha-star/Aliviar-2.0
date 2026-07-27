/**
 * PROVENIÊNCIA — de onde veio cada coisa, e o que deixa de valer quando a
 * origem muda.
 *
 * Por que existe: quando um registro é construído a partir de outros, ele
 * herda a validade deles. Se a informação de origem for corrigida, tudo que
 * foi derivado dela passa a descrever um mundo que não existe mais. Sem essa
 * verificação, o sistema continua exibindo, com confiança total, conclusões
 * baseadas em algo que já foi desmentido — e ninguém percebe, porque nada
 * quebra.
 *
 * Duas capacidades, uma disciplina só:
 *
 *   validateChain      → esta cadeia está íntegra?
 *   findInvalidated    → o que precisa ser refeito porque a origem mudou?
 *
 * Absorvido do encadeamento de referências entre artefatos do ACE, onde cada
 * protocolo repetia a mesma checagem à mão.
 *
 * Esta camada não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem
 * Administrador. Conhece registro e referência.
 */

import type { RecordId, RecordReference, VersionedRecord } from "./versioned-record";

/** O que a plataforma precisa saber sobre um registro para rastrear origem. */
export type ProvenanceNode = VersionedRecord & {
  readonly recordType: string;
  /** Os registros dos quais este foi derivado. Vazio = registro de origem. */
  readonly derivedFrom?: ReadonlyArray<RecordReference<string>>;
};

export type ProvenanceProblem =
  /** A referência aponta para um registro que não existe no conjunto dado. */
  | { readonly kind: "missing_source"; readonly recordId: RecordId; readonly reference: RecordReference<string> }
  /** A origem existe, mas com outro tipo do que a referência declara. */
  | {
      readonly kind: "type_mismatch";
      readonly recordId: RecordId;
      readonly reference: RecordReference<string>;
      readonly actualType: string;
    }
  /** A origem foi versionada depois. O derivado descreve um estado anterior. */
  | {
      readonly kind: "stale_source";
      readonly recordId: RecordId;
      readonly reference: RecordReference<string>;
      readonly currentVersion: number;
    }
  /** A cadeia se referencia em círculo — nada pode ser reconstruído. */
  | { readonly kind: "cycle"; readonly recordId: RecordId };

export type ProvenanceReport = {
  readonly intact: boolean;
  readonly problems: readonly ProvenanceProblem[];
};

function indexById(records: readonly ProvenanceNode[]): Map<RecordId, ProvenanceNode> {
  const index = new Map<RecordId, ProvenanceNode>();
  for (const record of records) {
    // A versão mais alta de um mesmo id é a corrente.
    const existing = index.get(record.id);
    if (!existing || record.version > existing.version) index.set(record.id, record);
  }
  return index;
}

function detectCycles(records: readonly ProvenanceNode[], index: Map<RecordId, ProvenanceNode>): RecordId[] {
  const state = new Map<RecordId, "visiting" | "done">();
  const inCycle: RecordId[] = [];

  function walk(id: RecordId): boolean {
    const current = state.get(id);
    if (current === "done") return false;
    if (current === "visiting") return true;

    state.set(id, "visiting");
    const node = index.get(id);
    for (const reference of node?.derivedFrom ?? []) {
      if (walk(reference.recordId)) {
        inCycle.push(id);
        state.set(id, "done");
        return true;
      }
    }
    state.set(id, "done");
    return false;
  }

  for (const record of records) walk(record.id);
  return inCycle;
}

/**
 * Verifica a integridade de uma cadeia de proveniência.
 *
 * Recebe o conjunto fechado de registros relevantes — não vai buscar nada. Uma
 * camada que não conhece domínio também não pode saber onde os dados moram.
 */
export function validateChain(records: readonly ProvenanceNode[]): ProvenanceReport {
  const index = indexById(records);
  const problems: ProvenanceProblem[] = [];

  for (const record of records) {
    for (const reference of record.derivedFrom ?? []) {
      const source = index.get(reference.recordId);

      if (!source) {
        problems.push({ kind: "missing_source", recordId: record.id, reference });
        continue;
      }
      if (source.recordType !== reference.recordType) {
        problems.push({
          kind: "type_mismatch",
          recordId: record.id,
          reference,
          actualType: source.recordType,
        });
        continue;
      }
      if (source.version !== reference.recordVersion) {
        problems.push({
          kind: "stale_source",
          recordId: record.id,
          reference,
          currentVersion: source.version,
        });
      }
    }
  }

  for (const recordId of detectCycles(records, index)) {
    problems.push({ kind: "cycle", recordId });
  }

  return { intact: problems.length === 0, problems };
}

export type InvalidationReason = {
  readonly recordId: RecordId;
  /** O registro cuja mudança causou a invalidação — a raiz, não o passo. */
  readonly causedBy: RecordId;
  /** Quantos passos de derivação separam este registro da raiz. */
  readonly distance: number;
};

/**
 * INVALIDAÇÃO EM CASCATA — dado que estes registros mudaram, o que deixa de
 * valer.
 *
 * Devolve os afetados, ordenados do mais próximo da raiz ao mais distante, e
 * NUNCA apaga nada. Invalidar é dizer "isto precisa ser olhado de novo", não
 * "isto é lixo" — quem decide o que fazer com um registro invalidado é quem
 * tem autoridade sobre ele, e frequentemente é uma pessoa.
 *
 * As raízes não aparecem no resultado: elas mudaram, não foram invalidadas.
 */
export function findInvalidated(
  records: readonly ProvenanceNode[],
  changed: readonly RecordId[],
): readonly InvalidationReason[] {
  const dependents = new Map<RecordId, RecordId[]>();
  for (const record of records) {
    for (const reference of record.derivedFrom ?? []) {
      const list = dependents.get(reference.recordId);
      if (list) list.push(record.id);
      else dependents.set(reference.recordId, [record.id]);
    }
  }

  const roots = new Set(changed);
  const found = new Map<RecordId, InvalidationReason>();
  let frontier: Array<{ id: RecordId; root: RecordId; distance: number }> = changed.map((id) => ({
    id,
    root: id,
    distance: 0,
  }));

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const { id, root, distance } of frontier) {
      for (const dependentId of dependents.get(id) ?? []) {
        if (roots.has(dependentId)) continue;
        const existing = found.get(dependentId);
        // Um registro pode ser alcançado por vários caminhos; guarda o mais
        // curto, que é o que melhor explica por que ele caiu.
        if (existing && existing.distance <= distance + 1) continue;
        found.set(dependentId, { recordId: dependentId, causedBy: root, distance: distance + 1 });
        next.push({ id: dependentId, root, distance: distance + 1 });
      }
    }
    frontier = next;
  }

  return [...found.values()].sort(
    (a, b) => a.distance - b.distance || a.recordId.localeCompare(b.recordId),
  );
}
