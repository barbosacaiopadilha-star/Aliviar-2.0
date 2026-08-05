import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  deixouDeValer,
  ESTADO_INICIAL_DA_REGRA,
  ESTADOS_DA_REGRA,
  podeVigorar,
  type VersaoDaRegra,
} from "@/modules/curadoria/regra-de-derivacao-contrato";

/**
 * ITEM 2.2A — O CONTRATO DA REGRA, E A PROVA DE QUE ELE NÃO OPERA.
 *
 * A prova de que o banco RECUSA uma regra vigente sem Autoridade de Método vive
 * em `tests/integration/regra-de-derivacao-inerte.integration.test.ts` — lá é
 * onde a exigência é impossibilidade de gravar, não recomendação. Aqui ficam as
 * provas que não precisam de banco.
 */

const RAIZ = process.cwd();
const CONTRATO = "src/modules/curadoria/regra-de-derivacao-contrato.ts";
const fonte = readFileSync(join(RAIZ, CONTRATO), "utf8");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

function versao(sobrescritas: Partial<VersaoDaRegra> = {}): VersaoDaRegra {
  return {
    identificador: "grau-para-importancia",
    versao: 1,
    estado: "PROPOSTA",
    vigencia: { inicio: null, fim: null },
    autoridade: { propostaPor: "engenharia", aprovadaPor: null, adrDeAprovacao: null },
    justificativa: "porque a ponte precisa de forma antes de valores",
    evidencia: "nenhuma operação real",
    encerradaEm: null,
    criadaEm: "2026-08-05T10:00:00.000Z",
    ...sobrescritas,
  };
}

describe("A2 · os quatro estados do §10.5", () => {
  it("são exatamente quatro, na ordem do ciclo de vida", () => {
    expect([...ESTADOS_DA_REGRA]).toEqual(["PROPOSTA", "VIGENTE", "SUSPENSA", "REVOGADA"]);
  });

  it("nenhum estado da PROPOSTA de derivação vazou para a Regra", () => {
    // ADR-066 §11 governa o oferecimento; §10.5 governa a regra. São ciclos de
    // vida distintos, e misturá-los apagaria a diferença entre "a sugestão foi
    // recusada" e "a regra que a gerou foi revogada".
    for (const alheio of ["CONFIRMADA", "SUPERADA", "RETIRADA", "PENDENTE"]) {
      expect(ESTADOS_DA_REGRA, alheio).not.toContain(alheio);
    }
  });

  it("toda regra nasce em PROPOSTA — sugerida, ainda sem dono que responda", () => {
    expect(ESTADO_INICIAL_DA_REGRA).toBe("PROPOSTA");
  });

  it("suspensa e revogada deixaram de valer; proposta e vigente, não", () => {
    expect(deixouDeValer("SUSPENSA")).toBe(true);
    expect(deixouDeValer("REVOGADA")).toBe(true);
    expect(deixouDeValer("PROPOSTA")).toBe(false);
    expect(deixouDeValer("VIGENTE")).toBe(false);
  });
});

describe("A3 · vigorar exige autoridade, ADR e vigência", () => {
  it("uma regra recém-proposta não pode vigorar", () => {
    expect(podeVigorar(versao())).toBe(false);
  });

  it("falta qualquer um dos três, e não pode vigorar", () => {
    const completa = versao({
      autoridade: { propostaPor: "engenharia", aprovadaPor: "autoridade", adrDeAprovacao: "ADR-999" },
      vigencia: { inicio: "2026-08-05T00:00:00.000Z", fim: null },
    });
    expect(podeVigorar(completa)).toBe(true);

    expect(
      podeVigorar({ ...completa, autoridade: { ...completa.autoridade, aprovadaPor: null } }),
      "sem autoridade aprovadora",
    ).toBe(false);
    expect(
      podeVigorar({ ...completa, autoridade: { ...completa.autoridade, adrDeAprovacao: null } }),
      "sem a ADR — aprovação sem ADR é opinião",
    ).toBe(false);
    expect(
      podeVigorar({ ...completa, vigencia: { inicio: null, fim: null } }),
      "sem início de vigência",
    ).toBe(false);
  });
});

describe("A1/A4/A5 · o contrato é tipo, e nada o consome", () => {
  it("nenhuma implementação operacional: sem banco, sem cliente, sem emissão", () => {
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
    expect(fonte.split("\n").filter((l) => l.trimStart().startsWith("import"))).toEqual([]);
  });

  it("A4 · nenhuma emissão de proposta nasce daqui", () => {
    for (const emissao of ["emitir", "proposta", "oferecimento", "derivar"]) {
      expect(fonte.toLowerCase().includes(`function ${emissao}`), emissao).toBe(false);
    }
  });

  it("A5 · nenhum Pipeline consome a Regra", () => {
    const FONTES = varrer("src");
    expect(FONTES.length).toBeGreaterThan(100);

    const consumidores = FONTES.filter(
      (arquivo) =>
        arquivo !== CONTRATO &&
        readFileSync(join(RAIZ, arquivo), "utf8").includes("regra-de-derivacao-contrato"),
    );
    expect(consumidores, "alguém começou a consumir a Regra antes da 2.2B").toEqual([]);
  });

  it("nenhum módulo de `src/` alcança a estrutura da Regra", () => {
    const alcancam = varrer("src").filter((arquivo) =>
      /from\(\s*["'`]derivation_rules["'`]\s*\)/i.test(readFileSync(join(RAIZ, arquivo), "utf8")),
    );
    expect(alcancam).toEqual([]);
  });

  it("nenhum repositório, action ou serviço da Regra existe", () => {
    const suspeitos = varrer("src").filter((arquivo) =>
      /regra-de-derivacao-(repository|actions?|loader|service)|derivation-rules?-(repository|actions?)/i.test(
        arquivo,
      ),
    );
    expect(suspeitos).toEqual([]);
  });
});

describe("A1 · a migration cria estrutura, e nada mais", () => {
  const sqlBruto = readFileSync(
    join(RAIZ, "supabase/migrations/20260805170000_infraestrutura_da_regra_de_derivacao.sql"),
    "utf8",
  );
  const sql = sqlBruto
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("--"))
    .join("\n");

  it("nenhum insert, seed ou regra de exemplo", () => {
    expect(/insert\s+into/i.test(sql), "a migration semeia uma regra").toBe(false);
  });

  it("nenhuma policy e nenhum grant a papel de aplicação", () => {
    expect(/create policy/i.test(sql)).toBe(false);
    expect(/grant[^;]*to\s+(anon|authenticated)/i.test(sql)).toBe(false);
    expect(sql).toMatch(/enable row level security/i);
  });

  it("nenhuma tabela de VALORES nasceu junto (§10.5: valores exigem Cases reais)", () => {
    for (const proibida of ["grau_para_importancia", "rule_values", "derivation_rule_values"]) {
      expect(sql.includes(proibida), `a migration criou ${proibida}`).toBe(false);
    }
    // Uma tabela só: a da Regra.
    expect([...sql.matchAll(/create table/gi)]).toHaveLength(1);
  });
});
