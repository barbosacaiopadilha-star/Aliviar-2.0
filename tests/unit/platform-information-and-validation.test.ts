import { describe, expect, it } from "vitest";

import { deepFreeze, isDeeplyFrozen } from "@/platform/immutability/deep-freeze";
import { CodedError, codeOf, isCodedError } from "@/platform/errors/coded-error";
import {
  absent,
  conflicting,
  INFORMATION_STATES,
  isPending,
  isSettled,
  known,
  needsHumanAttention,
  usableValue,
  type Evidence,
} from "@/platform/information/information-state";
import {
  advisory,
  blocking,
  blockingIssues,
  combine,
  issuesByField,
  resultOf,
} from "@/platform/validation/validation-result";

const evidencia: Evidence = { source: "declaracao_da_pessoa", excerpt: "prefiro de manhã" };

describe("estado da informação", () => {
  it("distingue ausência declarada de não perguntado", () => {
    // Os dois têm valor null. Tratá-los igual é o erro que esta camada impede.
    expect(isSettled("ausencia_declarada")).toBe(true);
    expect(isSettled("nao_perguntado")).toBe(false);
  });

  it("não cobra de novo o que a pessoa já respondeu", () => {
    expect(isPending("ausencia_declarada")).toBe(false);
    expect(isPending("nao_se_aplica")).toBe(false);
  });

  it("cobra o que ainda falta", () => {
    expect(isPending("desconhecido")).toBe(true);
    expect(isPending("sem_resposta")).toBe(true);
  });

  it("marca conflito e confirmação como assunto de humano", () => {
    expect(needsHumanAttention("conflitante")).toBe(true);
    expect(needsHumanAttention("requer_confirmacao")).toBe(true);
    expect(needsHumanAttention("conhecido")).toBe(false);
  });

  it("classifica todo estado declarado, sem buraco", () => {
    for (const state of INFORMATION_STATES) {
      expect(isSettled(state) !== isPending(state)).toBe(true);
    }
  });
});

describe("usableValue", () => {
  it("devolve o valor quando é seguro usar", () => {
    expect(usableValue(known("manha", evidencia))).toBe("manha");
  });

  it("recusa valor que ainda precisa de confirmação humana", () => {
    expect(usableValue({ value: "manha", state: "requer_confirmacao" })).toBeNull();
  });

  it("recusa valor em conflito em vez de escolher um lado", () => {
    const conflito = conflicting([
      { value: "manha", evidence: evidencia },
      { value: "tarde", evidence: { source: "formulario" } },
    ]);

    expect(usableValue(conflito)).toBeNull();
    expect(conflito.candidates).toHaveLength(2);
  });

  it("não transforma ausência declarada em valor", () => {
    expect(usableValue(absent("ausencia_declarada", evidencia))).toBeNull();
  });
});

describe("congelamento profundo", () => {
  it("congela níveis aninhados, não só a superfície", () => {
    const frozen = deepFreeze({ lista: [{ n: 1 }] });
    expect(isDeeplyFrozen(frozen)).toBe(true);
    expect(() => (frozen.lista as unknown as number[]).push(2)).toThrow();
  });

  it("lida com referência circular sem recorrer para sempre", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(isDeeplyFrozen(deepFreeze(a))).toBe(true);
  });

  it("congela Map e Set junto com o conteúdo", () => {
    const frozen = deepFreeze({ m: new Map([["k", { v: 1 }]]), s: new Set([{ v: 2 }]) });
    expect(isDeeplyFrozen(frozen)).toBe(true);
  });

  it("não invoca getters ao congelar", () => {
    let called = false;
    const target = {
      get armadilha() {
        called = true;
        return 1;
      },
    };
    deepFreeze(target);
    expect(called).toBe(false);
  });
});

describe("erro codificado", () => {
  const CODES = ["A", "B"] as const;
  class ErroDeTeste extends CodedError<(typeof CODES)[number]> {}

  it("preserva o nome da subclasse", () => {
    expect(new ErroDeTeste({ code: "A", message: "x" }).name).toBe("ErroDeTeste");
  });

  it("reconhece erro codificado sem instanceof", () => {
    expect(isCodedError(new ErroDeTeste({ code: "A", message: "x" }))).toBe(true);
    expect(isCodedError(new Error("comum"))).toBe(false);
  });

  it("extrai apenas códigos do conjunto permitido", () => {
    const erro = new ErroDeTeste({ code: "A", message: "x" });
    expect(codeOf(erro, CODES)).toBe("A");
    expect(codeOf(erro, ["Z"] as const)).toBeNull();
    expect(codeOf("nem erro é", CODES)).toBeNull();
  });

  it("não expõe rastro de pilha no registro de auditoria", () => {
    const record = new ErroDeTeste({ code: "B", message: "x", origin: "aqui" }).toRecord();
    expect(record).not.toHaveProperty("stack");
    expect(record.origin).toBe("aqui");
  });

  it("preserva a causa original", () => {
    const causa = new Error("raiz");
    expect(new ErroDeTeste({ code: "A", message: "x", cause: causa }).cause).toBe(causa);
  });
});

describe("contrato de validação", () => {
  it("um aviso não invalida; um bloqueio invalida", () => {
    expect(resultOf([advisory("a", "olhe isto")]).valid).toBe(true);
    expect(resultOf([blocking("a", "não dá")]).valid).toBe(false);
  });

  it("combina validadores preservando todos os achados", () => {
    const resultado = combine(resultOf([blocking("a", "x")]), resultOf([advisory("b", "y")]));

    expect(resultado.issues).toHaveLength(2);
    expect(resultado.valid).toBe(false);
    expect(blockingIssues(resultado)).toHaveLength(1);
  });

  it("agrupa por campo para a tela apontar no lugar certo", () => {
    const agrupado = issuesByField(resultOf([blocking("a", "x"), advisory("a", "y")]));
    expect(agrupado.get("a")).toHaveLength(2);
  });

  it("não para no primeiro erro", () => {
    const resultado = resultOf([blocking("a", "x"), blocking("b", "y"), blocking("c", "z")]);
    expect(resultado.issues.map((i) => i.field)).toEqual(["a", "b", "c"]);
  });
});
