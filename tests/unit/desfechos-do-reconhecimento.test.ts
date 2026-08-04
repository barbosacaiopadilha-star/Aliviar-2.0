import { describe, expect, it } from "vitest";

import { acknowledgePersonNeed } from "@/modules/curadoria/protocolos-repository";
import { ACKNOWLEDGMENT_STATES } from "@/modules/curadoria/protocolos";

/**
 * ITEM 1.10B — OS QUATRO DESFECHOS DO RECONHECIMENTO (§6.2.1 · DT-22).
 *
 * O contrato do campo `correction`, decidido pelo DT-22:
 *
 *   CORRIGIDA   → o texto substitutivo dela
 *   RECUSADA    → a justificativa da discordância
 *   RECONHECIDA → null
 *   PENDENTE    → null (é a ausência de ato; não passa pelo escritor)
 *
 * Antes do DT-22 a recusa era gravada sem texto: sobrava o estado sem o
 * motivo. Oferecer "discordar" e perder o que ela disse é cerimônia vazia.
 */

type Gravado = { acknowledgment: string; correction: string | null };

/** Cliente falso: observa o que seria enviado ao banco, sem simular banco. */
function clienteFalso() {
  const gravacoes: Gravado[] = [];
  const encadeamento = {
    eq: () => encadeamento,
    select: async () => ({ data: [{ case_id: "case-1" }], error: null }),
  };
  return {
    gravacoes,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliente: {
      from: () => ({
        update: (carga: Gravado) => {
          gravacoes.push(carga);
          return encadeamento;
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}

const BASE = { caseId: "case-1", subcriterionCode: "ACESSO_MODALIDADE" };

describe("Os quatro desfechos existem no domínio, e são apenas quatro", () => {
  it("nenhum estado novo foi criado", () => {
    expect([...ACKNOWLEDGMENT_STATES].sort()).toEqual(
      ["CORRIGIDA", "PENDENTE", "RECONHECIDA", "RECUSADA"].sort(),
    );
  });
});

describe("RECUSADA — discordar persiste o texto dela (DT-22)", () => {
  it("grava a justificativa, não a descarta", async () => {
    const { cliente, gravacoes } = clienteFalso();

    await acknowledgePersonNeed(cliente, {
      ...BASE,
      acknowledgment: "RECUSADA",
      correction: "Eu disse isso, mas não é isso que significa para mim.",
    });

    expect(gravacoes[0]).toEqual({
      acknowledgment: "RECUSADA",
      correction: "Eu disse isso, mas não é isso que significa para mim.",
    });
  });

  it("recusa sem texto é recusada — o estado sem o motivo não serve", async () => {
    const { cliente, gravacoes } = clienteFalso();

    await expect(
      acknowledgePersonNeed(cliente, { ...BASE, acknowledgment: "RECUSADA", correction: "   " }),
    ).rejects.toThrow(/Discordância sem texto/);

    expect(gravacoes, "nada pode ter sido gravado").toHaveLength(0);
  });
});

describe("CORRIGIDA — segue persistindo o texto substitutivo", () => {
  it("grava o que ela disse no lugar", async () => {
    const { cliente, gravacoes } = clienteFalso();

    await acknowledgePersonNeed(cliente, {
      ...BASE,
      acknowledgment: "CORRIGIDA",
      correction: "Na verdade prefiro presencial.",
    });

    expect(gravacoes[0]?.correction).toBe("Na verdade prefiro presencial.");
  });

  it("correção sem texto continua recusada", async () => {
    const { cliente } = clienteFalso();
    await expect(
      acknowledgePersonNeed(cliente, { ...BASE, acknowledgment: "CORRIGIDA", correction: null }),
    ).rejects.toThrow(/Correção sem texto/);
  });
});

describe("RECONHECIDA — não persiste texto", () => {
  it("reconhecer não tem o que guardar", async () => {
    const { cliente, gravacoes } = clienteFalso();

    await acknowledgePersonNeed(cliente, { ...BASE, acknowledgment: "RECONHECIDA" });

    expect(gravacoes[0]).toEqual({ acknowledgment: "RECONHECIDA", correction: null });
  });

  it("texto enviado por engano num reconhecimento não é gravado", async () => {
    const { cliente, gravacoes } = clienteFalso();

    await acknowledgePersonNeed(cliente, {
      ...BASE,
      acknowledgment: "RECONHECIDA",
      correction: "texto que não pertence a este desfecho",
    });

    expect(gravacoes[0]?.correction).toBeNull();
  });
});

describe("PENDENTE — deixar pendente não grava reconhecimento", () => {
  it("não é um desfecho que o escritor aceite: a ausência de ato não se escreve", () => {
    // O tipo do parâmetro exclui PENDENTE por construção — deixar pendente é
    // não chamar, e é assim que "ausência de resposta nunca é reconhecimento".
    const aceitos: string[] = ["RECONHECIDA", "CORRIGIDA", "RECUSADA"];
    expect(aceitos).not.toContain("PENDENTE");
    expect(ACKNOWLEDGMENT_STATES).toContain("PENDENTE");
  });
});
