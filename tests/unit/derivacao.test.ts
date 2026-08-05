import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  derivar,
  MOTIVOS_DE_NAO_DERIVAR,
  type EntradaDaDerivacao,
} from "@/modules/curadoria/derivacao";

/**
 * ITEM 1.A — A FUNÇÃO PURA DA CAMADA DE DERIVAÇÃO.
 *
 * O que estes testes protegem é, antes de tudo, o que a função NÃO faz. A
 * ADR-066 §1 define o oferecimento como "um ato do sistema dirigido a um
 * humano" — e a pureza é o que garante que esse ato seja reproduzível: mesma
 * entrada, mesma saída, hoje e daqui a um ano, sem depender de relógio, de
 * banco ou de catálogo global.
 */

const ENTRADA: EntradaDaDerivacao = {
  declaracao: {
    registro: "case_needs:abc",
    versao: "1",
    autor: "a pessoa",
    declaradoEm: "2026-03-10T12:00:00.000Z",
    valores: ["PREFIRO_VIDEO"],
  },
  conceito: {
    code: "ACESSO_MODALIDADE",
    campo: "importancia",
    escalaFechada: ["MUITO_IMPORTANTE", "IMPORTANTE", "RELEVANTE"],
    catalogVersion: "1.1.0",
  },
  participacaoNoMotor: "DIRETO",
  mapeamento: { PREFIRO_VIDEO: "MUITO_IMPORTANTE" },
};

function comEntrada(sobrescritas: Partial<EntradaDaDerivacao>): EntradaDaDerivacao {
  return { ...ENTRADA, ...sobrescritas };
}

describe("A1 · o que sai é a estrutura derivada", () => {
  it("deriva o valor sugerido a partir do que ela declarou", () => {
    const saida = derivar(ENTRADA);

    expect(saida.derivou).toBe(true);
    if (!saida.derivou) return;

    expect(saida.valorSugerido).toBe("MUITO_IMPORTANTE");
    expect(saida.subcriterionCode).toBe("ACESSO_MODALIDADE");
    expect(saida.campo).toBe("importancia");
    expect(saida.catalogVersion).toBe("1.1.0");
  });

  it("a proveniência da ORIGEM viaja junto, inteira e sem reescrita", () => {
    const saida = derivar(ENTRADA);
    if (!saida.derivou) throw new Error("deveria ter derivado");

    // Itens 4 a 7 da ADR-066 §14 — todos já existiam na entrada.
    expect(saida.origem).toEqual(ENTRADA.declaracao);
    expect(saida.origem.declaradoEm).toBe("2026-03-10T12:00:00.000Z");
    expect(saida.origem.autor).toBe("a pessoa");
  });

  it("o código canônico atravessa; nenhum rótulo aparece (I-2)", () => {
    const saida = derivar(ENTRADA);
    if (!saida.derivou) throw new Error("deveria ter derivado");

    expect(saida.subcriterionCode).toBe(ENTRADA.conceito.code);
    expect(saida.valorSugerido).toMatch(/^[A-Z_]+$/);
  });
});

describe("A3 · conceito NUNCA jamais produz derivação (DP-1)", () => {
  it("recusa antes de olhar declaração, mapeamento ou escala", () => {
    const saida = derivar(comEntrada({ participacaoNoMotor: "NUNCA" }));

    expect(saida.derivou).toBe(false);
    if (saida.derivou) return;
    expect(saida.motivo).toBe("EXIGE_JUIZO_HUMANO");
  });

  it("recusa mesmo com tudo perfeito — não é falta de dado, é decisão de Método", () => {
    // Se o motivo saísse como "SEM_DECLARACAO", sugeriria que HAVENDO
    // declaração haveria derivação. Não haveria.
    const saida = derivar(
      comEntrada({
        participacaoNoMotor: "NUNCA",
        declaracao: { ...ENTRADA.declaracao, valores: [] },
      }),
    );

    expect(saida.derivou).toBe(false);
    if (saida.derivou) return;
    expect(saida.motivo).toBe("EXIGE_JUIZO_HUMANO");
    expect(saida.motivo).not.toBe("SEM_DECLARACAO");
  });

  it("DIRETO e INDIRETO seguem derivando — INDIRETO não foi decidido aqui", () => {
    for (const participacao of ["DIRETO", "INDIRETO"] as const) {
      const saida = derivar(comEntrada({ participacaoNoMotor: participacao }));
      expect(saida.derivou, participacao).toBe(true);
    }
  });
});

describe("A4 · pureza, determinismo e idempotência", () => {
  it("mesma entrada, mesma saída — cem execuções", () => {
    const primeira = derivar(ENTRADA);
    for (let i = 0; i < 100; i += 1) {
      expect(derivar(ENTRADA)).toEqual(primeira);
    }
  });

  it("idempotente: executar duas vezes seguidas não muda nada", () => {
    expect(derivar(ENTRADA)).toEqual(derivar(ENTRADA));
    expect(derivar(comEntrada({ participacaoNoMotor: "NUNCA" }))).toEqual(
      derivar(comEntrada({ participacaoNoMotor: "NUNCA" })),
    );
  });

  it("não muta a entrada — quem chama recebe de volta o que passou", () => {
    const entrada = structuredClone(ENTRADA);
    const copia = structuredClone(ENTRADA);

    derivar(entrada);
    derivar(entrada);

    expect(entrada).toEqual(copia);
  });

  it("a ordem dos valores declarados não muda o resultado", () => {
    const mapeamento = { A: "IMPORTANTE", B: "IMPORTANTE" };
    const umaOrdem = derivar(
      comEntrada({
        declaracao: { ...ENTRADA.declaracao, valores: ["A", "B"] },
        mapeamento,
      }),
    );
    const outraOrdem = derivar(
      comEntrada({
        declaracao: { ...ENTRADA.declaracao, valores: ["B", "A"] },
        mapeamento,
      }),
    );

    // A comparação é sobre o que a função DERIVA. `origem` não entra: ela é a
    // declaração repassada fielmente, e uma pessoa que declarou ["A","B"] não
    // declarou ["B","A"] — reordenar a fala dela para o teste fechar seria
    // exatamente o tipo de reescrita que esta camada não pode fazer.
    expect(umaOrdem.derivou).toBe(true);
    expect(outraOrdem.derivou).toBe(true);
    if (!umaOrdem.derivou || !outraOrdem.derivou) return;

    expect(umaOrdem.valorSugerido).toBe(outraOrdem.valorSugerido);
    expect(umaOrdem.subcriterionCode).toBe(outraOrdem.subcriterionCode);
    expect(umaOrdem.campo).toBe(outraOrdem.campo);
    expect(umaOrdem.catalogVersion).toBe(outraOrdem.catalogVersion);
  });

  it("a ordem tampouco muda a RECUSA — ambiguidade é ambiguidade nos dois sentidos", () => {
    const mapeamento = { A: "MUITO_IMPORTANTE", B: "RELEVANTE" };
    const umaOrdem = derivar(
      comEntrada({ declaracao: { ...ENTRADA.declaracao, valores: ["A", "B"] }, mapeamento }),
    );
    const outraOrdem = derivar(
      comEntrada({ declaracao: { ...ENTRADA.declaracao, valores: ["B", "A"] }, mapeamento }),
    );

    expect(umaOrdem.derivou).toBe(false);
    expect(outraOrdem.derivou).toBe(false);
    if (umaOrdem.derivou || outraOrdem.derivou) return;
    expect(umaOrdem.motivo).toBe(outraOrdem.motivo);
  });

  it("não devolve identidade, data de emissão, regra nem versão de regra", () => {
    const saida = derivar(ENTRADA);
    if (!saida.derivou) throw new Error("deveria ter derivado");

    // Os itens 1, 8, 9 e 10 da ADR-066 §14 pertencem a quem persiste (2.1).
    for (const campo of ["id", "identidade", "emitidoEm", "regra", "versaoDaRegra"]) {
      expect(saida, campo).not.toHaveProperty(campo);
    }
  });
});

describe("A2/A4/A5 · sem efeito colateral e sem dependência escondida", () => {
  const fonte = readFileSync(join(process.cwd(), "src/modules/curadoria/derivacao.ts"), "utf8");
  const semComentarios = fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("//"))
    .join("\n");

  it("não consulta banco, não escreve, não chama RPC", () => {
    for (const proibido of [
      "supabase",
      ".from(",
      ".rpc(",
      "insert",
      "update",
      "delete",
      "createClient",
    ]) {
      expect(semComentarios.includes(proibido), `a função faz ${proibido}`).toBe(false);
    }
  });

  it("não lê relógio, não sorteia, não gera identidade", () => {
    for (const proibido of ["Date.now", "new Date", "Math.random", "randomUUID", "crypto"]) {
      expect(semComentarios.includes(proibido), `a função usa ${proibido}`).toBe(false);
    }
  });

  it("A2 · não produz proposta persistida, regra, versão nem auditoria", () => {
    for (const proibido of ["audit", "GENERATOR_VERSION", "versaoDaRegra", "ruleVersion"]) {
      expect(semComentarios.includes(proibido), `a função produz ${proibido}`).toBe(false);
    }
    // C-01 — a tabela da Camada de Derivação não é criada nem citada.
    expect(fonte.toLowerCase()).not.toContain("derivation_proposals");
  });

  it("A5 · nenhuma dependência global — só um `import type`", () => {
    const imports = fonte
      .split("\n")
      .filter((linha) => linha.trimStart().startsWith("import"))
      .map((linha) => linha.trim());

    expect(imports).toEqual(['import type { MotorParticipation } from "./evidencias-pratica";']);
    // Tipo, não valor: nada do Catálogo é lido em tempo de execução.
    expect(imports[0]).toContain("import type");
  });

  it("A5 · a participação CHEGA como entrada; o Catálogo não é consultado", () => {
    for (const global of [
      "PRACTICE_CATALOG",
      "SUBCRITERION_CATALOG",
      "participaDoMotor",
      "apenasConceitosDoMotor",
      "PERSON_QUESTIONS_BY_CODE",
    ]) {
      expect(semComentarios.includes(global), `a função lê ${global} por dentro`).toBe(false);
    }
  });
});

describe("As recusas, uma a uma — cada não tem nome", () => {
  it("sem declaração não há origem", () => {
    const saida = derivar(
      comEntrada({ declaracao: { ...ENTRADA.declaracao, valores: [] } }),
    );
    expect(saida.derivou).toBe(false);
    if (!saida.derivou) expect(saida.motivo).toBe("SEM_DECLARACAO");
  });

  it("declarado sem correspondência no mapeamento não vira palpite", () => {
    const saida = derivar(comEntrada({ mapeamento: { OUTRA_COISA: "IMPORTANTE" } }));
    expect(saida.derivou).toBe(false);
    if (!saida.derivou) expect(saida.motivo).toBe("SEM_CORRESPONDENCIA");
  });

  it("correspondência ambígua não é resolvida pelo sistema — ele oferece, não decide", () => {
    const saida = derivar(
      comEntrada({
        declaracao: { ...ENTRADA.declaracao, valores: ["A", "B"] },
        mapeamento: { A: "MUITO_IMPORTANTE", B: "RELEVANTE" },
      }),
    );
    expect(saida.derivou).toBe(false);
    if (!saida.derivou) expect(saida.motivo).toBe("CORRESPONDENCIA_AMBIGUA");
  });

  it("valor fora da escala fechada do campo é recusado", () => {
    const saida = derivar(comEntrada({ mapeamento: { PREFIRO_VIDEO: "INVENTADO" } }));
    expect(saida.derivou).toBe(false);
    if (!saida.derivou) expect(saida.motivo).toBe("FORA_DA_ESCALA_DO_CAMPO");
  });

  it("toda recusa nomeia o conceito e o campo — nunca um `false` mudo", () => {
    for (const entrada of [
      comEntrada({ participacaoNoMotor: "NUNCA" as const }),
      comEntrada({ declaracao: { ...ENTRADA.declaracao, valores: [] } }),
      comEntrada({ mapeamento: {} }),
    ]) {
      const saida = derivar(entrada);
      expect(saida.derivou).toBe(false);
      if (saida.derivou) continue;
      expect(saida.subcriterionCode).toBe("ACESSO_MODALIDADE");
      expect(saida.campo).toBe("importancia");
      expect(MOTIVOS_DE_NAO_DERIVAR).toContain(saida.motivo);
    }
  });
});
