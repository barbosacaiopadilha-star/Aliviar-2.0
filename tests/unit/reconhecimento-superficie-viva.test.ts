import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ITEM 1.10B-P2 · ETAPA 2B — A SUPERFÍCIE VIVA.
 *
 * O que estes testes protegem não é aparência: é a direção das dependências e
 * a existência de um caminho único. Duas superfícies do mesmo Perfil divergem
 * em silêncio; uma UI que volta ao banco remonta o que o modelo já montou.
 */

const RAIZ = process.cwd();
const ler = (relativo: string) => readFileSync(join(RAIZ, relativo), "utf8");

const CONTRATO = "src/modules/paciente/reconhecimento-contrato.ts";
const MODELO = "src/modules/paciente/reconhecimento-model.ts";
const COMPONENTE = "src/components/paciente/reconhecimento-duas-colunas.tsx";
const PAINEL = "src/components/paciente/perfil-panel.tsx";
const CARTAO = "src/components/paciente/experiencia/profile-card.tsx";
const ROTA = "src/app/paciente/page.tsx";

describe("B1 · a direção da dependência", () => {
  it("o contrato dos tipos existe fora do componente", () => {
    const contrato = ler(CONTRATO);
    expect(contrato).toContain("export type LinhaDoReconhecimento");
    expect(contrato).toContain("export type LinhaTecnica");
    expect(contrato).toContain("export type ModeloDoReconhecimento");
  });

  it("o modelo importa os tipos do contrato, nunca do componente", () => {
    const modelo = ler(MODELO);
    expect(modelo).toContain("@/modules/paciente/reconhecimento-contrato");
    expect(
      modelo.includes("@/components/"),
      "a camada de dados voltou a depender de um .tsx",
    ).toBe(false);
  });

  it("o componente importa os tipos do módulo", () => {
    expect(ler(COMPONENTE)).toContain("@/modules/paciente/reconhecimento-contrato");
  });

  it("não há ciclo: o contrato não conhece nem o modelo nem a tela", () => {
    const contrato = ler(CONTRATO);
    expect(contrato.includes("@/components/")).toBe(false);
    expect(contrato.includes("reconhecimento-model")).toBe(false);
    // E não arrasta o servidor para dentro de um componente: o que importa é o
    // import, não a palavra — o comentário do arquivo explica justamente por
    // que o tipo mora aqui e não no loader.
    expect(contrato).not.toMatch(/^\s*import\s+["']server-only["']/m);
  });

  it("o cartão tipa o modelo pelo contrato, não pelo loader `server-only`", () => {
    const cartao = ler(CARTAO);
    expect(cartao).toContain("@/modules/paciente/reconhecimento-contrato");
    expect(cartao.includes("reconhecimento-model")).toBe(false);
  });
});

describe("B5 · o modelo é a fonte única da tela", () => {
  it("a rota viva carrega o modelo no servidor", () => {
    const rota = ler(ROTA);
    expect(rota).toContain("loadModeloDoReconhecimento");
    expect(rota).toContain("modelo={modeloDoReconhecimento");
  });

  it("o cartão repassa linhas e tecnicos ao painel, sem tocar em nenhum dos dois", () => {
    const cartao = ler(CARTAO);
    expect(cartao).toContain("linhas={modelo?.linhas}");
    expect(cartao).toContain("tecnicos={modelo?.tecnicos}");
  });

  it("nenhuma das três superfícies consulta o banco", () => {
    for (const arquivo of [COMPONENTE, PAINEL, CARTAO]) {
      const fonte = ler(arquivo);
      for (const proibido of ["createServerSupabaseClient", "supabase", ".from(", "select("]) {
        expect(fonte.includes(proibido), `${arquivo} → ${proibido}`).toBe(false);
      }
    }
  });

  it("nenhuma superfície remonta a cadeia nem refaz a partição", () => {
    for (const arquivo of [COMPONENTE, PAINEL, CARTAO]) {
      const fonte = ler(arquivo);
      expect(fonte.includes("montarCadeiaDeProveniencia"), arquivo).toBe(false);
      expect(fonte.includes("PERSON_QUESTIONS_BY_CODE"), arquivo).toBe(false);
      expect(fonte.includes("IMPORTANCE_LABELS"), arquivo).toBe(false);
      expect(fonte.includes("NEED_DEGREE_LABELS"), arquivo).toBe(false);
    }
  });
});

describe("B6 · uma superfície só", () => {
  it("o painel usa a comparação como superfície do reconhecimento", () => {
    const painel = ler(PAINEL);
    expect(painel).toContain("ReconhecimentoDuasColunas");
    expect(painel).toContain("reconhecendo");
  });

  it("a lista antiga e a comparação são exclusivas — nunca as duas juntas", () => {
    const painel = ler(PAINEL);
    // A exclusividade é estrutural: um ternário, não dois blocos independentes.
    expect(painel).toContain("{reconhecendo ? (");
    expect(painel).toContain(") : perfil.prioridades.length === 0 ? (");
  });

  it("nenhuma outra superfície viva desenha a comparação", () => {
    const consumidores = [
      "src/components/paciente",
      "src/app/paciente",
    ].flatMap((dir) => varrer(dir));

    const queImportam = consumidores.filter((arquivo) =>
      ler(arquivo).includes("reconhecimento-duas-colunas"),
    );

    expect(queImportam, "a comparação tem mais de um consumidor vivo").toEqual([PAINEL]);
  });
});

/**
 * B7 · O ATO PRESERVADO.
 *
 * `ReconhecerPerfil` NÃO é uma superfície concorrente: é o desfecho — o único
 * já implementado — e escreve pelo escritor autorizado existente. A Etapa 2B
 * troca o que ela LÊ antes de decidir, não o que acontece quando ela decide.
 */
describe("B7 · confirmar continua operável, e só ele", () => {
  it("o ato segue na tela dela, pelo escritor autorizado de sempre", () => {
    expect(ler(PAINEL)).toContain("ReconhecerPerfil");
    expect(ler("src/components/paciente/reconhecer-perfil.tsx")).toContain(
      "reconhecerPerfilAction",
    );
  });

  it("nenhum desfecho das etapas 2C/2D foi antecipado na tela", () => {
    const superficies = [COMPONENTE, PAINEL, "src/components/paciente/reconhecer-perfil.tsx"];
    for (const arquivo of superficies) {
      const fonte = ler(arquivo);
      for (const futuro of ["Discordar", "Deixar pendente", "supersed", "Superado"]) {
        expect(fonte.includes(futuro), `${arquivo} antecipou "${futuro}"`).toBe(false);
      }
    }
  });

  it("a persistência do reconhecimento não foi tocada por esta etapa", () => {
    const acao = ler("src/modules/paciente/reconhecimento-actions.ts");
    expect(acao.includes("linhas")).toBe(false);
    expect(acao.includes("ModeloDoReconhecimento")).toBe(false);
  });
});

function varrer(dir: string): string[] {
  const { readdirSync } = require("node:fs") as typeof import("node:fs");
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}
