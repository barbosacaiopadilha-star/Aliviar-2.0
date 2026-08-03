// =============================================================================
// A AUTORIDADE VIGENTE, TRAVADA POR TESTE (Release de Reconstrução).
//
// Durante a release, um pedido pediu de volta o orçamento de 100 pontos, a
// rejeição por soma ≠ 100 e a cobertura percentual de 0 a 100. As ADR-041 e
// ADR-042 já haviam aposentado os três — e a divergência foi reconhecida.
//
// Este arquivo existe para que a decisão não dependa de memória: se alguma
// superfície voltar a gravar pesos, a somar pontos ou a mostrar porcentagem
// de compatibilidade, o teste falha aqui, com o nome da ADR que isso quebra.
// =============================================================================
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_RESULTS,
  crossOne,
} from "@/modules/curadoria/motor-compatibilidade";
import {
  IMPORTANCE_LEVELS,
  SUBCRITERION_CATALOG,
} from "@/modules/curadoria/mapa-prioridades";

const SRC = path.resolve(__dirname, "../../src");

function arquivosDeCodigo(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = path.join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      arquivosDeCodigo(caminho, acc);
    } else if (/\.tsx?$/.test(nome)) {
      acc.push(caminho);
    }
  }
  return acc;
}

const TODOS = arquivosDeCodigo(SRC);
const relativo = (arquivo: string) => path.relative(SRC, arquivo).replace(/\\/g, "/");

/**
 * Código sem comentários.
 *
 * Necessário porque a documentação da própria remoção cita o que foi removido
 * — "este painel exibia a distribuição de 100 pontos (ADR-042)". Esse texto é
 * memória institucional e deve continuar existindo; o que não pode voltar é o
 * comportamento. O teste olha só para o código executável.
 */
function codigoSemComentarios(arquivo: string): string {
  return readFileSync(arquivo, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("ADR-042 — o Mapa de Prioridades é a única fonte de 'quanto importa'", () => {
  it("nenhuma superfície grava em cruzamento_weights", () => {
    const gravacoes: string[] = [];
    for (const arquivo of TODOS) {
      const conteudo = readFileSync(arquivo, "utf-8");
      if (!conteudo.includes("cruzamento_weights")) continue;
      // Leitura de histórico é permitida (ADR-042 item 4: dados preservados).
      // Gravação, não: insert/update/upsert/delete sobre a tabela.
      const gravou = /\.from\(\s*["'`]cruzamento_weights["'`]\s*\)[\s\S]{0,200}?\.(insert|update|upsert|delete)\(/.test(
        conteudo,
      );
      if (gravou) gravacoes.push(relativo(arquivo));
    }
    expect(gravacoes, `ADR-042: o orçamento de 100 pontos deixou de ser fonte de verdade`).toEqual([]);
  });

  it("a escala é fechada em cinco níveis, sem número digitável", () => {
    expect(IMPORTANCE_LEVELS).toHaveLength(5);
    for (const nivel of IMPORTANCE_LEVELS) {
      expect(nivel).toMatch(/^[A-Z_]+$/);
      expect(nivel).not.toMatch(/\d/);
    }
  });

  it("o catálogo vigente tem 29 conceitos (1.1.0, ADR-065) e nenhum código aposentado", () => {
    expect(SUBCRITERION_CATALOG.filter((entry) => entry.active)).toHaveLength(29);
    const codigos = new Set(SUBCRITERION_CATALOG.map((entry) => entry.code));
    for (const aposentado of [
      "HISTORICO_REGULARIDADE",
      "EXPERIENCIA_CASOS_SEMELHANTES",
      "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
      "HISTORICO_PRODUCAO_ACADEMICA",
      "HISTORICO_ENSINO_E_PESQUISA",
      "ACESSO_LOCALIZACAO",
    ]) {
      expect(codigos.has(aposentado), `${aposentado} voltou ao catálogo`).toBe(false);
    }
  });

  it("nenhuma superfície soma pontos até 100 ou 200", () => {
    const suspeitos: string[] = [];
    for (const arquivo of TODOS) {
      const conteudo = codigoSemComentarios(arquivo);
      // "100 pontos"/"200 pontos" em texto de interface, ou constante de
      // orçamento — as duas formas em que o modelo aposentado reaparece.
      if (/\b(100|200)\s*(pontos|pts)\b/i.test(conteudo)) suspeitos.push(relativo(arquivo));
      if (/(TOTAL_BUDGET|ORCAMENTO_TOTAL|BUDGET_TOTAL)\s*=/.test(conteudo)) suspeitos.push(relativo(arquivo));
    }
    expect(suspeitos, "ADR-042: o paciente deixou de ver pontuação").toEqual([]);
  });
});

describe("ADR-041 — quatro resultados por subcritério, nenhum score", () => {
  it("os resultados possíveis são exatamente os quatro", () => {
    expect([...COMPATIBILITY_RESULTS].sort()).toEqual(
      ["ALTA_COMPATIBILIDADE", "LACUNA_DE_INFORMACAO", "MEDIA_COMPATIBILIDADE", "NAO_RELEVANTE"].sort(),
    );
  });

  it("toda combinação da matriz devolve um dos quatro — nunca número", () => {
    for (const importancia of IMPORTANCE_LEVELS) {
      for (const estado of ["CONFIRMADO", "NAO_CONFIRMADO", "NAO_INFORMADO"] as const) {
        const resultado = crossOne(importancia, estado);
        expect(COMPATIBILITY_RESULTS).toContain(resultado);
        expect(typeof resultado).toBe("string");
      }
    }
  });

  it("nenhuma superfície do paciente exibe porcentagem de compatibilidade", () => {
    const suspeitos: string[] = [];
    const superficiesDaPaciente = TODOS.filter((arquivo) => {
      const rel = relativo(arquivo);
      return rel.startsWith("app/paciente/") || rel.startsWith("components/paciente/");
    });
    for (const arquivo of superficiesDaPaciente) {
      const conteudo = codigoSemComentarios(arquivo);
      // Porcentagem colada a compatibilidade/cobertura/aderência — o formato
      // exato que a ADR-041 proíbe. `%` isolado (CSS, template) não conta.
      if (/(compatibilidade|cobertura|aderência|aderencia)[^\n]{0,40}%/i.test(conteudo)) {
        suspeitos.push(relativo(arquivo));
      }
      if (/\b(score|ranking|colocação|colocacao|1º lugar|primeiro lugar)\b/i.test(conteudo)) {
        suspeitos.push(relativo(arquivo));
      }
    }
    expect(suspeitos, "ADR-041: nenhum score, nota, porcentagem ou ranking").toEqual([]);
  });
});
