import { describe, expect, it } from "vitest";

import {
  findFieldViolations,
  reachableKeys,
  type FieldPolicy,
} from "@/platform/information/field-policy";

// Vocabulário inventado: a Plataforma não conhece o de ninguém.
type Etapa = "cedo" | "meio" | "tarde";

const policy: FieldPolicy<Etapa> = {
  permanentlyForbidden: ["proibido", "nuncaJamais"],
  reservedUntil: { conclusao: "tarde", parcial: "meio" },
  stageOrder: { cedo: 1, meio: 2, tarde: 3 },
};

describe("reachableKeys", () => {
  it("encontra chaves aninhadas — esconder não deveria funcionar", () => {
    expect(reachableKeys({ a: { b: { c: 1 } } })).toEqual(new Set(["a", "b", "c"]));
  });

  it("atravessa arrays", () => {
    expect(reachableKeys({ lista: [{ escondido: 1 }] })).toEqual(new Set(["lista", "escondido"]));
  });

  it("não entra em laço com referência circular", () => {
    const alvo: Record<string, unknown> = { a: 1 };
    alvo.self = alvo;
    expect(reachableKeys(alvo)).toEqual(new Set(["a", "self"]));
  });
});

describe("findFieldViolations", () => {
  it("acusa campo proibido permanentemente, em qualquer etapa", () => {
    for (const etapa of ["cedo", "meio", "tarde"] as const) {
      expect(findFieldViolations({ proibido: 1 }, policy, etapa)).toEqual([
        { kind: "permanently_forbidden", field: "proibido" },
      ]);
    }
  });

  it("acusa campo proibido escondido em objeto aninhado", () => {
    expect(findFieldViolations({ x: { y: { proibido: 1 } } }, policy, "cedo")).toHaveLength(1);
  });

  it("acusa campo antecipado, dizendo a partir de quando ele valeria", () => {
    expect(findFieldViolations({ conclusao: 1 }, policy, "cedo")).toEqual([
      { kind: "anticipated", field: "conclusao", availableFrom: "tarde" },
    ]);
  });

  it("aceita o mesmo campo na etapa em que ele passa a ser legítimo", () => {
    expect(findFieldViolations({ conclusao: 1 }, policy, "tarde")).toEqual([]);
  });

  it("aceita o campo em etapa posterior à reservada", () => {
    expect(findFieldViolations({ parcial: 1 }, policy, "tarde")).toEqual([]);
  });

  it("distingue os dois tipos de violação em vez de achatar numa lista só", () => {
    const violations = findFieldViolations({ proibido: 1, conclusao: 2 }, policy, "cedo");
    expect(violations.map((v) => v.kind).sort()).toEqual(["anticipated", "permanently_forbidden"]);
  });

  it("não acusa nada num registro limpo", () => {
    expect(findFieldViolations({ ok: 1, outro: { tambemOk: 2 } }, policy, "cedo")).toEqual([]);
  });

  it("não lança — quem decide o que fazer é quem chama", () => {
    expect(() => findFieldViolations({ proibido: 1 }, policy, "cedo")).not.toThrow();
  });
});
