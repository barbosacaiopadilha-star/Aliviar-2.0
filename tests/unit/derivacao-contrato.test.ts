import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ehLeitorAutorizado } from "./guardas-curadoria-2-0/leitores-de-proposta-autorizados";

import {
  ehEstadoTerminal,
  ESTADO_INICIAL,
  ESTADOS_DO_OFERECIMENTO,
} from "@/modules/curadoria/derivacao-contrato";

/**
 * ITEM 2.1 — O CONTRATO DA ESTRUTURA, E A PROVA DE QUE ELE NÃO OPERA.
 *
 * A estrutura existe (migration 20260805090000) e nada a alcança. Estes testes
 * guardam a segunda metade: que o contrato seja TIPO, e que nenhum pipeline
 * nasça em `src/` — nem repositório, nem action, nem RPC, nem loader.
 *
 * A prova de inércia no BANCO vive em
 * `tests/integration/derivacao-inerte.integration.test.ts`: zero linha, zero
 * policy, RLS ligada, nenhum grant.
 */

const RAIZ = process.cwd();
const CONTRATO = "src/modules/curadoria/derivacao-contrato.ts";
const fonte = readFileSync(join(RAIZ, CONTRATO), "utf8");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

describe("A3 · o contrato é tipo, e só", () => {
  it("os cinco estados do §11, na ordem da ADR — e PENDENTE não é um deles", () => {
    expect([...ESTADOS_DO_OFERECIMENTO]).toEqual([
      "PROPOSTA",
      "CONFIRMADA",
      "RECUSADA",
      "SUPERADA",
      "RETIRADA",
    ]);
    expect(ESTADOS_DO_OFERECIMENTO).not.toContain("PENDENTE");
  });

  it("PROPOSTA é o único não terminal (§11)", () => {
    expect(ESTADO_INICIAL).toBe("PROPOSTA");
    expect(ehEstadoTerminal("PROPOSTA")).toBe(false);
    for (const estado of ESTADOS_DO_OFERECIMENTO.filter((e) => e !== "PROPOSTA")) {
      expect(ehEstadoTerminal(estado), estado).toBe(true);
    }
  });

  it("nenhuma implementação operacional: sem banco, sem cliente, sem escrita", () => {
    for (const proibido of [
      "supabase",
      "createClient",
      ".from(",
      ".rpc(",
      "insert",
      "update",
      "delete",
      "use server",
      "use client",
    ]) {
      expect(fonte.includes(proibido), `o contrato faz ${proibido}`).toBe(false);
    }
  });

  it("não importa nada — o contrato não depende de ninguém", () => {
    const imports = fonte.split("\n").filter((linha) => linha.trimStart().startsWith("import"));
    expect(imports).toEqual([]);
  });
});

describe("A4 · nenhum pipeline nasceu", () => {
  const FONTES = varrer("src");

  it("a varredura cobre a árvore inteira — lista vazia passaria calada", () => {
    expect(FONTES.length).toBeGreaterThan(100);
  });

  it("nenhum repositório, action, loader ou serviço da Camada de Derivação existe", () => {
    const suspeitos = FONTES.filter((arquivo) =>
      /derivacao-(repository|actions?|loader|service|servico)|derivation-(repository|actions?)/i.test(
        arquivo,
      ),
    );
    expect(suspeitos, "um pipeline nasceu antes das dez dependências do §15.0").toEqual([]);
  });

  it("A2 · nenhum módulo de `src/` alcança a estrutura — sem exceção", () => {
    // C-01 já prova isto pelo nome da tabela; aqui a mesma verdade pela porta
    // do consumo, para que renomear a tabela não abra a porta em silêncio.
    //
    // LAVRATURA `78e261c` (§21.6): a exceção nominal da `e1186ec` deixou de
    // existir — com a capability, o repositório invoca a FUNÇÃO e a tabela some
    // de `src/` por inteiro. A lista nominal mudou de sujeito (chamadores da
    // capability, C-01d) e não isenta mais ninguém aqui.
    // ABERTURA 2.C (PA-17 §10): a Fronteira APRESENTA cada proposta com os
    // nove elementos do A2c, e a leitura nominal dela alcança a tabela pelo
    // caminho servidor autorizado — LEITURA, jamais escrita (provado logo
    // abaixo e no unit do 2.C). A isenção é de UM arquivo, por nome.
    const LEITURA_DA_FRONTEIRA = "src/modules/curadoria/fronteira-do-mapa-repository.ts";
    const alcancam = FONTES.filter((arquivo) => {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      return /from\(\s*["'`]derivation_proposals["'`]\s*\)/i.test(codigo);
    });
    expect(alcancam.map((a) => a.split("\\").join("/"))).toEqual([LEITURA_DA_FRONTEIRA]);

    // E o que ela faz com a tabela continua sendo só ler: qualquer escrita
    // pela aplicação derruba — o caminho de escrita é a capability.
    const fronteira = readFileSync(join(RAIZ, LEITURA_DA_FRONTEIRA), "utf8");
    for (const escrita of [".insert(", ".upsert(", ".update(", ".delete("]) {
      expect(fronteira.includes(escrita), `a leitura da Fronteira escreve: ${escrita}`).toBe(false);
    }

    // E a lista de chamadores não vaza para cá: nem o nome exato isenta.
    expect(ehLeitorAutorizado("src/modules/curadoria/cadeia-de-proveniencia-repository.ts")).toBe(
      true,
    );
    expect(
      FONTES.filter(
        (arquivo) =>
          ehLeitorAutorizado(arquivo) &&
          /from\(\s*["'`]derivation_proposals["'`]\s*\)/i.test(readFileSync(join(RAIZ, arquivo), "utf8")),
      ),
      "o chamador da capability voltou a alcançar a tabela diretamente.",
    ).toEqual([]);
  });

  it("o contrato não tem consumidor — é biblioteca inerte, por desenho", () => {
    // A busca é por FRONTEIRA, não por substring: o 2.2B criou
    // `regra-de-derivacao-contrato`, que CONTÉM `derivacao-contrato` no nome e
    // é outro arquivo. Casar por substring acusaria quem nunca importou este
    // contrato — e a guarda passaria a proteger o nome, não a inércia.
    const consumidores = FONTES.filter(
      (arquivo) =>
        arquivo !== CONTRATO &&
        /(^|[/"'`])derivacao-contrato["'`]/.test(readFileSync(join(RAIZ, arquivo), "utf8")),
    );
    expect(consumidores, "alguém começou a consumir o contrato antes da 2.C").toEqual([]);
  });
});
