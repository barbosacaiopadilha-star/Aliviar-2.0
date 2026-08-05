import { describe, expect, it } from "vitest";

import { PRACTICE_CATALOG } from "@/modules/curadoria/evidencias-pratica";
import { IMPORTANCE_LEVELS } from "@/modules/curadoria/mapa-prioridades";
import { SUBCRITERION_STATUSES } from "@/modules/curadoria/mapa-profissional";
import {
  celulaDoMotor,
  crossOne,
  crossPriorityAndProfessional,
} from "@/modules/curadoria/motor-compatibilidade";
import {
  apenasConceitosDoMotor,
  ConceitoForaDoMotorError,
  conceitosForaDoMotor,
  participaDoMotor,
} from "@/modules/curadoria/participacao-no-motor";

/**
 * ITEM 1.1 — `MOTOR_PARTICIPATION` EXECUTÁVEL (DP-1 ratificada).
 *
 * A declaração existia desde sempre e ninguém a lia: o Motor cruzava os quatro
 * conceitos `NUNCA` como se fossem qualquer outro (achado P15). O Método dizia
 * uma coisa e o software fazia outra.
 *
 * O que estes testes protegem é a distância entre as duas — e que ela seja
 * fechada em DOIS pontos independentes, para que a segunda barreira exista
 * justamente no dia em que a primeira falhar.
 */

const NUNCA = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA").map((c) => c.code);
const PARTICIPAM = PRACTICE_CATALOG.filter((c) => c.motor !== "NUNCA").map((c) => c.code);

describe("pré-condições do oráculo", () => {
  it("há conceitos dos dois lados — senão os testes abaixo seriam vazios", () => {
    expect(NUNCA.length).toBe(4);
    expect(PARTICIPAM.length).toBeGreaterThan(20);
    expect(new Set([...NUNCA, ...PARTICIPAM]).size).toBe(PRACTICE_CATALOG.length);
  });

  it("a lista é DERIVADA do Catálogo, nunca escrita à mão", () => {
    expect(conceitosForaDoMotor()).toEqual([...NUNCA].sort());
  });
});

describe("A1 · conceito NUNCA jamais chega ao cruzamento", () => {
  it("nunca produz célula, nem com Mapa declarado e estado confirmado", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: NUNCA.map((code) => ({
        subcriterionCode: code,
        importance: "MUITO_IMPORTANTE" as const,
      })),
      professionalStates: NUNCA.map((code) => ({
        subcriterionCode: code,
        status: "CONFIRMADO" as const,
      })),
      activeSubcriterionCodes: NUNCA,
    });

    expect(leitura.rows).toEqual([]);
  });

  it("nunca entra na matriz junto dos que participam — só os outros sobram", () => {
    const todos = [...NUNCA, ...PARTICIPAM];
    const leitura = crossPriorityAndProfessional({
      casePriorities: todos.map((code) => ({
        subcriterionCode: code,
        importance: "MUITO_IMPORTANTE" as const,
      })),
      professionalStates: todos.map((code) => ({
        subcriterionCode: code,
        status: "CONFIRMADO" as const,
      })),
      activeSubcriterionCodes: todos,
    });

    const cruzados = leitura.rows.map((row) => row.subcriterionCode);
    for (const code of NUNCA) {
      expect(cruzados, `${code} chegou ao cruzamento`).not.toContain(code);
    }
    expect(cruzados.sort()).toEqual([...PARTICIPAM].sort());
  });

  it("nunca altera a cobertura: o resumo conta só quem participa", () => {
    const todos = [...NUNCA, ...PARTICIPAM];
    const leitura = crossPriorityAndProfessional({
      casePriorities: todos.map((code) => ({
        subcriterionCode: code,
        importance: "MUITO_IMPORTANTE" as const,
      })),
      professionalStates: todos.map((code) => ({
        subcriterionCode: code,
        status: "CONFIRMADO" as const,
      })),
      activeSubcriterionCodes: todos,
    });

    expect(leitura.summary.totalSubcriteria).toBe(PARTICIPAM.length);
    expect(leitura.summary.highCompatibility).toBe(PARTICIPAM.length);
  });

  it("não sobra como pendência: NUNCA não está aguardando declaração", () => {
    // Nenhum deles no Mapa do Case — e ainda assim não contam como "o Case
    // ainda não declarou", porque não há o que declarar para o Motor.
    const leitura = crossPriorityAndProfessional({
      casePriorities: [],
      professionalStates: [],
      activeSubcriterionCodes: [...NUNCA, ...PARTICIPAM],
    });

    expect(leitura.summary.notDeclaredByCase).toBe(PARTICIPAM.length);
  });
});

describe("A2 · defesa em profundidade — dois níveis independentes", () => {
  it("NÍVEL 1 · a entrada tira os NUNCA do universo", () => {
    expect(apenasConceitosDoMotor([...NUNCA, ...PARTICIPAM])).toEqual(PARTICIPAM);
    expect(apenasConceitosDoMotor(NUNCA)).toEqual([]);
  });

  it("NÍVEL 2 · a célula recusa por conta própria, mesmo se a entrada falhar", () => {
    // Este é o cenário do "amanhã": alguém escreve um caminho novo que não
    // passa pelo filtro de entrada. A segunda barreira não depende da primeira.
    for (const code of NUNCA) {
      expect(() => celulaDoMotor(code, "MUITO_IMPORTANTE", "CONFIRMADO"), code).toThrow(
        ConceitoForaDoMotorError,
      );
    }
  });

  it("a recusa nomeia o conceito — erro de código não vira dado ruim silencioso", () => {
    try {
      celulaDoMotor(NUNCA[0]!, "MUITO_IMPORTANTE", "CONFIRMADO");
      expect.unreachable("a célula deveria ter recusado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(ConceitoForaDoMotorError);
      expect((erro as Error).message).toContain(NUNCA[0]!);
      expect((erro as Error).message).toContain("juízo humano");
    }
  });

  it("os dois níveis usam a MESMA fonte — não podem divergir", () => {
    for (const code of NUNCA) expect(participaDoMotor(code)).toBe(false);
    for (const code of PARTICIPAM) expect(participaDoMotor(code)).toBe(true);
  });
});

describe("A5 · nada mais muda", () => {
  it("a matriz da ADR-041 continua intocada: 15 combinações, mesmos resultados", () => {
    for (const importancia of IMPORTANCE_LEVELS) {
      for (const estado of SUBCRITERION_STATUSES) {
        // `crossOne` não sabe de conceito e não deve saber — é a matriz.
        expect(typeof crossOne(importancia, estado), `${importancia}/${estado}`).toBe("string");
      }
    }
  });

  it("conceito que participa gera exatamente a célula da matriz", () => {
    for (const code of PARTICIPAM.slice(0, 6)) {
      for (const importancia of IMPORTANCE_LEVELS) {
        for (const estado of SUBCRITERION_STATUSES) {
          expect(celulaDoMotor(code, importancia, estado), `${code} ${importancia}/${estado}`).toBe(
            crossOne(importancia, estado),
          );
        }
      }
    }
  });

  it("DIRETO e INDIRETO seguem cruzando — INDIRETO não foi decidido aqui", () => {
    const diretos = PRACTICE_CATALOG.filter((c) => c.motor === "DIRETO").map((c) => c.code);
    const indiretos = PRACTICE_CATALOG.filter((c) => c.motor === "INDIRETO").map((c) => c.code);

    expect(diretos.length).toBeGreaterThan(0);
    expect(indiretos.length).toBeGreaterThan(0);

    for (const code of [...diretos, ...indiretos]) {
      expect(participaDoMotor(code), code).toBe(true);
    }

    const leitura = crossPriorityAndProfessional({
      casePriorities: indiretos.map((code) => ({
        subcriterionCode: code,
        importance: "IMPORTANTE" as const,
      })),
      professionalStates: [],
      activeSubcriterionCodes: indiretos,
    });
    // Sem estado do profissional, a leitura é LACUNA — exatamente como antes.
    expect(leitura.rows).toHaveLength(indiretos.length);
    expect(leitura.summary.informationGaps).toBe(indiretos.length);
  });
});

describe("A3 · nada é apagado — a guarda impede uso, não existência", () => {
  it("o conceito continua no Catálogo, íntegro e legível", () => {
    for (const code of NUNCA) {
      const conceito = PRACTICE_CATALOG.find((c) => c.code === code)!;
      expect(conceito, code).toBeTruthy();
      expect(conceito.name.length).toBeGreaterThan(0);
      expect(conceito.motor).toBe("NUNCA");
    }
  });

  it("a guarda não escreve, não deleta, não toca persistência", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const fonte = readFileSync(
      join(process.cwd(), "src/modules/curadoria/participacao-no-motor.ts"),
      "utf8",
    );

    for (const proibido of ["delete", ".from(", "insert", "update", "supabase", "rpc("]) {
      expect(fonte.includes(proibido), `a guarda faz ${proibido}`).toBe(false);
    }
  });
});
