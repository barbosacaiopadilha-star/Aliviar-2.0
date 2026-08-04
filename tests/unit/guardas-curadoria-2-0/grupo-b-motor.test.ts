import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_RESULTS,
  crossOne,
  crossPriorityAndProfessional,
  summarySentence,
} from "@/modules/curadoria/motor-compatibilidade";
import { IMPORTANCE_LEVELS } from "@/modules/curadoria/mapa-prioridades";
import { SUBCRITERION_STATUSES } from "@/modules/curadoria/mapa-profissional";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO B: MOTOR
 *
 * ┌ B-01 — Ausência nunca significa incompatibilidade
 * │ Objetivo ......... impedir que "não sei" ou "não tem" vire eliminação.
 * │ Princípio ........ Congelamento I-8; Arquitetura P-04 e §4.5.
 * │ Arquivos ......... motor-compatibilidade.ts
 * │ Validação ........ varredura exaustiva das 15 células.
 * │ Teste ............ positivo (célula certa) · negativo (nenhum resultado de
 * │                    exclusão existe) · fronteira (importância máxima com
 * │                    ausência para em MÉDIA).
 * │ Falha ............ alguém acrescenta um quinto resultado de exclusão, ou
 * │                    faz ausência cair em resultado pior que MÉDIA.
 * │ Detecção ......... suíte unitária.
 * ├ B-02 — O Motor não cria conhecimento
 * │ Objetivo ......... o Motor lê declarações; não busca, não infere, não
 * │                    consulta relógio, banco, rede ou ambiente.
 * │ Princípio ........ Arquitetura §2.3 (invariante de pureza) e §4.1.
 * │ Validação ........ leitura do código-fonte real dos dois motores.
 * │ Falha ............ um `new Date()`, um `fetch`, um cliente de banco.
 * ├ B-03 — O Motor não ordena, não elimina, não suprime
 * │ Princípio ........ Congelamento I-1 e §4.8; Arquitetura P-02.
 * │ Validação ........ permutação da entrada + contagem de linhas.
 * └ B-04 — O Motor não pontua
 *   Princípio ........ Congelamento §4.8; Arquitetura §4.4 e §4.6.
 */

const MOTOR_DIR = path.join(process.cwd(), "src", "modules", "curadoria");
const MODULOS_PUROS = ["motor-compatibilidade.ts", "motor-relacional.ts"] as const;

function fonteDoMotor(arquivo: string): string {
  return readFileSync(path.join(MOTOR_DIR, arquivo), "utf8");
}

/** Remove comentários: os motores explicam em prosa o que se recusam a fazer. */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("B-01 · Ausência nunca significa incompatibilidade", () => {
  it("nenhum dos quatro resultados é veredito de exclusão", () => {
    for (const resultado of COMPATIBILITY_RESULTS) {
      expect(
        /INCOMPAT|ELIMIN|REPROV|INADEQUAD|NAO_ATENDE|DESCART/i.test(resultado),
        `O resultado "${resultado}" tem vocabulário de exclusão. O Motor não elimina ninguém.`,
      ).toBe(false);
    }
  });

  it("'não informado' produz lacuna ou irrelevância — nunca prejuízo ao profissional", () => {
    for (const nivel of IMPORTANCE_LEVELS) {
      const resultado = crossOne(nivel, "NAO_INFORMADO");
      expect(
        ["LACUNA_DE_INFORMACAO", "NAO_RELEVANTE"],
        `${nivel} × NAO_INFORMADO devolveu "${resultado}". Ausência de informação não é ausência da característica.`,
      ).toContain(resultado);
    }
  });

  it("fronteira: a importância máxima com ausência confirmada para em MÉDIA", () => {
    expect(crossOne("MUITO_IMPORTANTE", "NAO_CONFIRMADO")).toBe("MEDIA_COMPATIBILIDADE");
    for (const nivel of IMPORTANCE_LEVELS) {
      expect(crossOne(nivel, "NAO_CONFIRMADO")).not.toBe("ALTA_COMPATIBILIDADE");
    }
  });

  it("regressão: nenhum profissional some da leitura por não ter mapa nenhum", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: [
        { subcriterionCode: "ACESSO_MODALIDADE", importance: "MUITO_IMPORTANTE" },
        { subcriterionCode: "CONTINUIDADE_RETORNOS", importance: "IMPORTANTE" },
      ],
      professionalStates: [],
      activeSubcriterionCodes: ["ACESSO_MODALIDADE", "CONTINUIDADE_RETORNOS"],
    });
    expect(leitura.rows).toHaveLength(2);
    expect(leitura.summary.informationGaps).toBe(2);
    expect(leitura.summary.gapsWithoutAnyRecord).toBe(2);
  });
});

describe("B-02 · O Motor não cria conhecimento", () => {
  for (const arquivo of MODULOS_PUROS) {
    it(`${arquivo} não consulta relógio, aleatório, rede, ambiente ou banco`, () => {
      const fonte = semComentarios(fonteDoMotor(arquivo));
      const proibidos: [RegExp, string][] = [
        [/new Date\(/, "new Date()"],
        [/Date\.now\(/, "Date.now()"],
        [/Math\.random\(/, "Math.random()"],
        [/\bfetch\(/, "fetch()"],
        [/process\.env/, "process.env"],
        [/@supabase|createClient|SupabaseClient/, "cliente de banco"],
        [/\bawait\b/, "await (o Motor é síncrono e puro)"],
      ];
      for (const [padrao, nome] of proibidos) {
        expect(
          padrao.test(fonte),
          `${arquivo} usa ${nome}. O Motor lê o que lhe entregam — não busca conhecimento em lugar nenhum.`,
        ).toBe(false);
      }
    });

    it(`${arquivo} só importa catálogo, tipos e protocolos — nunca repositório, action ou framework`, () => {
      const fonte = fonteDoMotor(arquivo);
      const especificadores = [...fonte.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const especificador of especificadores) {
        expect(
          /repository|actions|next|react|server-only|supabase/i.test(especificador),
          `${arquivo} importa "${especificador}" — dependência de infraestrutura dentro de um motor puro.`,
        ).toBe(false);
      }
    });
  }
});

describe("B-03 · O Motor não ordena, não elimina, não suprime", () => {
  const catalogo = ["ACESSO_MODALIDADE", "CONTINUIDADE_RETORNOS", "MODELO_COMUNICACAO"];
  const prioridades = [
    { subcriterionCode: "MODELO_COMUNICACAO", importance: "RELEVANTE" },
    { subcriterionCode: "ACESSO_MODALIDADE", importance: "MUITO_IMPORTANTE" },
    { subcriterionCode: "CONTINUIDADE_RETORNOS", importance: "NAO_INFLUENCIA" },
  ] as const;

  it("permutar a entrada não muda a saída — a ordem é a do catálogo, não a de chegada", () => {
    const direta = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [{ subcriterionCode: "ACESSO_MODALIDADE", status: "CONFIRMADO" }],
      activeSubcriterionCodes: catalogo,
    });
    const invertida = crossPriorityAndProfessional({
      casePriorities: [...prioridades].reverse(),
      professionalStates: [{ subcriterionCode: "ACESSO_MODALIDADE", status: "CONFIRMADO" }],
      activeSubcriterionCodes: catalogo,
    });
    expect(invertida).toEqual(direta);
    expect(direta.rows.map((r) => r.subcriterionCode)).toEqual(catalogo);
  });

  it("nenhuma linha declarada é suprimida por causa do resultado", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [],
      activeSubcriterionCodes: catalogo,
    });
    expect(leitura.rows).toHaveLength(prioridades.length);
    for (const resultado of new Set(leitura.rows.map((r) => r.result))) {
      expect(COMPATIBILITY_RESULTS).toContain(resultado);
    }
  });

  it("a saída não expõe posição, colocação nem campo de ordem", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [],
      activeSubcriterionCodes: catalogo,
    });
    for (const chave of Object.keys(leitura.rows[0])) {
      expect(
        /rank|posicao|position|ordem|order|indice|index/i.test(chave),
        `A linha da leitura expõe "${chave}" — campo de ordenação onde a arquitetura proíbe ordenar.`,
      ).toBe(false);
    }
  });
});

describe("B-04 · O Motor não pontua", () => {
  it("a frase de resumo conta ocorrências e não emite juízo nem percentual", () => {
    for (const estado of SUBCRITERION_STATUSES) {
      const frase = summarySentence(
        crossPriorityAndProfessional({
          casePriorities: [{ subcriterionCode: "ACESSO_MODALIDADE", importance: "IMPORTANTE" }],
          professionalStates: [{ subcriterionCode: "ACESSO_MODALIDADE", status: estado }],
          activeSubcriterionCodes: ["ACESSO_MODALIDADE"],
        }).summary,
      );
      expect(frase).not.toMatch(/%|por cento|score|nota|pontos|ranking|melhor|ideal|recomend/i);
    }
  });

  it("Mapa vazio: a frase diz que não há o que cruzar — não devolve zero como se fosse leitura", () => {
    const frase = summarySentence(
      crossPriorityAndProfessional({
        casePriorities: [],
        professionalStates: [],
        activeSubcriterionCodes: ["ACESSO_MODALIDADE"],
      }).summary,
    );
    expect(frase).toMatch(/não foi preenchido/i);
  });
});
