import { describe, expect, it } from "vitest";

import { diffJson } from "@/lib/json-diff";

describe("diffJson (sprint de Observabilidade do ACE — comparação entre versões)", () => {
  it("retorna lista vazia quando os dois valores são idênticos", () => {
    expect(diffJson({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toEqual([]);
  });

  it("detecta um campo alterado, identificando o caminho", () => {
    const diff = diffJson({ status: "BLOCKED" }, { status: "COMPOSED" });
    expect(diff).toEqual([{ path: "status", before: "BLOCKED", after: "COMPOSED", kind: "changed" }]);
  });

  it("detecta um campo adicionado e um removido", () => {
    const diff = diffJson({ a: 1 }, { b: 2 });
    expect(diff).toContainEqual({ path: "a", before: 1, after: undefined, kind: "removed" });
    expect(diff).toContainEqual({ path: "b", before: undefined, after: 2, kind: "added" });
  });

  it("percorre objetos aninhados construindo o caminho completo", () => {
    const diff = diffJson(
      { decisionStatement: { goal: "x", decision: "y" } },
      { decisionStatement: { goal: "x", decision: "z" } },
    );
    expect(diff).toEqual([{ path: "decisionStatement.decision", before: "y", after: "z", kind: "changed" }]);
  });

  it("trata arrays como objetos indexados por posição", () => {
    const diff = diffJson({ items: ["a", "b"] }, { items: ["a", "c"] });
    expect(diff).toEqual([{ path: "items.1", before: "b", after: "c", kind: "changed" }]);
  });

  it("um valor raiz totalmente diferente (não objeto) usa o caminho '(raiz)'", () => {
    expect(diffJson("antes", "depois")).toEqual([{ path: "(raiz)", before: "antes", after: "depois", kind: "changed" }]);
  });

  it("nunca lança para valores nulos/undefined em qualquer lado", () => {
    expect(() => diffJson(null, { a: 1 })).not.toThrow();
    expect(() => diffJson(undefined, undefined)).not.toThrow();
  });
});
