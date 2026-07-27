import { describe, expect, it } from "vitest";

import { isDeeplyFrozen } from "@/platform/immutability/deep-freeze";
import {
  findInvalidated,
  validateChain,
  type ProvenanceNode,
} from "@/platform/records/provenance";
import {
  createInitialVersion,
  createNextVersion,
  isDecisional,
  referenceTo,
} from "@/platform/records/versioned-record";

function node(
  id: string,
  recordType: string,
  version: number,
  derivedFrom: ProvenanceNode["derivedFrom"] = [],
): ProvenanceNode {
  return { id, version, createdAt: "2026-01-01T00:00:00.000Z", producedBy: "teste", recordType, derivedFrom };
}

describe("createInitialVersion", () => {
  it("estampa identidade e origem, sem recebê-las do chamador", () => {
    const record = createInitialVersion({ titulo: "algo" }, "tela-x");

    expect(record.version).toBe(1);
    expect(record.producedBy).toBe("tela-x");
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.previousVersionId).toBeUndefined();
  });

  it("devolve o registro congelado em profundidade", () => {
    const record = createInitialVersion({ dados: { lista: [1, 2] } }, "tela-x");
    expect(isDeeplyFrozen(record)).toBe(true);
  });
});

describe("createNextVersion", () => {
  it("cria uma versão nova apontando para a anterior, sem sobrescrever", () => {
    const first = createInitialVersion({ titulo: "antes" }, "tela-x");
    const second = createNextVersion(first, { titulo: "depois" }, "tela-y");

    expect(second.version).toBe(2);
    expect(second.previousVersionId).toBe(first.id);
    expect(second.id).not.toBe(first.id);
    expect(second.producedBy).toBe("tela-y");
    // O anterior continua existindo e continua dizendo o que dizia.
    expect(first.titulo).toBe("antes");
  });
});

describe("autoridade", () => {
  it("só reconhece decisão em registro de decisão humana", () => {
    expect(isDecisional({ authority: "human_decision" })).toBe(true);
    expect(isDecisional({ authority: "analysis" })).toBe(false);
    expect(isDecisional({ authority: "delivery" })).toBe(false);
  });
});

describe("referenceTo", () => {
  it("aponta para uma versão exata, nunca para 'a mais recente'", () => {
    const record = createInitialVersion({}, "tela-x");
    const reference = referenceTo(record, "Coisa");

    expect(reference).toEqual({ recordId: record.id, recordVersion: 1, recordType: "Coisa" });
  });
});

describe("validateChain", () => {
  const origem = node("a", "Origem", 1);

  it("aceita uma cadeia íntegra", () => {
    const derivado = node("b", "Derivado", 1, [
      { recordId: "a", recordVersion: 1, recordType: "Origem" },
    ]);

    expect(validateChain([origem, derivado]).intact).toBe(true);
  });

  it("acusa origem ausente", () => {
    const orfao = node("b", "Derivado", 1, [
      { recordId: "z", recordVersion: 1, recordType: "Origem" },
    ]);

    const report = validateChain([orfao]);
    expect(report.intact).toBe(false);
    expect(report.problems[0]?.kind).toBe("missing_source");
  });

  it("acusa tipo divergente", () => {
    const derivado = node("b", "Derivado", 1, [
      { recordId: "a", recordVersion: 1, recordType: "OutraCoisa" },
    ]);

    expect(validateChain([origem, derivado]).problems[0]).toMatchObject({
      kind: "type_mismatch",
      actualType: "Origem",
    });
  });

  it("acusa quando a origem foi versionada depois do derivado", () => {
    const origemV2 = node("a", "Origem", 2);
    const derivado = node("b", "Derivado", 1, [
      { recordId: "a", recordVersion: 1, recordType: "Origem" },
    ]);

    expect(validateChain([origemV2, derivado]).problems[0]).toMatchObject({
      kind: "stale_source",
      currentVersion: 2,
    });
  });

  it("acusa ciclo em vez de recorrer para sempre", () => {
    const a = node("a", "A", 1, [{ recordId: "b", recordVersion: 1, recordType: "B" }]);
    const b = node("b", "B", 1, [{ recordId: "a", recordVersion: 1, recordType: "A" }]);

    const report = validateChain([a, b]);
    expect(report.problems.some((p) => p.kind === "cycle")).toBe(true);
  });
});

describe("findInvalidated", () => {
  //  a → b → c
  //    ↘ d
  const a = node("a", "A", 1);
  const b = node("b", "B", 1, [{ recordId: "a", recordVersion: 1, recordType: "A" }]);
  const c = node("c", "C", 1, [{ recordId: "b", recordVersion: 1, recordType: "B" }]);
  const d = node("d", "D", 1, [{ recordId: "a", recordVersion: 1, recordType: "A" }]);
  const grafo = [a, b, c, d];

  it("alcança toda a cascata a partir da raiz", () => {
    expect(findInvalidated(grafo, ["a"]).map((r) => r.recordId)).toEqual(["b", "d", "c"]);
  });

  it("não inclui a própria raiz — ela mudou, não foi invalidada", () => {
    expect(findInvalidated(grafo, ["a"]).some((r) => r.recordId === "a")).toBe(false);
  });

  it("atribui cada afetado à raiz que o causou", () => {
    const [primeiro] = findInvalidated(grafo, ["b"]);
    expect(primeiro).toMatchObject({ recordId: "c", causedBy: "b", distance: 1 });
  });

  it("não invalida quem não deriva da raiz", () => {
    expect(findInvalidated(grafo, ["d"])).toEqual([]);
  });

  it("não entra em laço com cadeia circular", () => {
    const x = node("x", "X", 1, [{ recordId: "y", recordVersion: 1, recordType: "Y" }]);
    const y = node("y", "Y", 1, [{ recordId: "x", recordVersion: 1, recordType: "X" }]);

    expect(findInvalidated([x, y], ["x"]).map((r) => r.recordId)).toEqual(["y"]);
  });

  it("nunca remove nada — apenas devolve o que precisa ser olhado de novo", () => {
    const antes = [...grafo];
    findInvalidated(grafo, ["a"]);
    expect(grafo).toEqual(antes);
  });
});
