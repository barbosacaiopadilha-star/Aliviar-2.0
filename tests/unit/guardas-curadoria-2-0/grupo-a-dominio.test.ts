import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_LABELS,
  COMPATIBILITY_RESULTS,
  crossOne,
  crossPriorityAndProfessional,
} from "@/modules/curadoria/motor-compatibilidade";
import { IMPORTANCE_LEVELS, SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";
import { SUBCRITERION_STATUSES } from "@/modules/curadoria/mapa-profissional";
import { PRACTICE_CATALOG } from "@/modules/curadoria/evidencias-pratica";
import { MATRIZ_RELACIONAL, relationalSummary } from "@/modules/curadoria/motor-relacional";
import { NEED_DEGREES } from "@/modules/curadoria/protocolos";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO A: DOMÍNIO
 *
 * Pacote F-01. Estas guardas não criam comportamento: elas tornam executável
 * o que hoje é promessa escrita no `CONGELAMENTO_ARQUITETURAL.md` §4 e no
 * `ARQUITETURA_CURADORIA_2_0.md` §2.6 e §17.1 (A6, A7).
 *
 * ┌ A-01 — Contagens invioláveis do domínio
 * │ Objetivo ......... impedir que 28/15/4/5/3 mudem por descuido.
 * │ Princípio ........ Congelamento §4.1 e §4.2; Arquitetura §2.6 (A7).
 * │ Arquivos ......... evidencias-pratica.ts · mapa-prioridades.ts ·
 * │                    mapa-profissional.ts · motor-compatibilidade.ts
 * │ Validação ........ contagem direta sobre os catálogos e a matriz reais.
 * │ Teste ............ positivo (contagens certas) + fronteira (matriz completa).
 * │ Falha ............ alguém acrescenta, remove ou renomeia conceito, nível,
 * │                    estado ou resultado.
 * │ Detecção ......... suíte unitária, sem banco, em qualquer build.
 * ├ A-02 — Proibição do total combinado
 * │ Objetivo ......... nenhum resumo do Motor ganha campo agregado.
 * │ Princípio ........ Congelamento §4.8; Arquitetura §4.4 e §17.1 (A6).
 * │ Validação ........ conjunto de chaves dos dois resumos, pinado exatamente.
 * │ Falha ............ um campo `total`, `score`, `nota` ou `percentual` nasce.
 * ├ A-03 — As quatro leituras nunca se somam
 * │ Objetivo ......... impedir que Compatibilidade e Relacional virem uma nota.
 * │ Princípio ........ Arquitetura §4.4 ("somá-las faria uma comprar
 * │                    deficiência da outra") e §10.2.
 * │ Validação ........ chaves disjuntas entre os dois resumos (spread não
 * │                    funde) + ausência de valor numérico nas matrizes.
 * │ Falha ............ alguém cria um resumo único ou dá números às células.
 * └ A-04 — Nenhum rótulo julga a pessoa
 *   Princípio ........ Congelamento I-5 e I-9; Arquitetura §11.5.
 */

const LEXICO_DE_JUIZO =
  /\b(melhor|pior|ideal|excelente|ótim|superior|inferior|recomendad|vencedor|top|nota|score|ranking|posição|colocação|percentual|%)/i;

/**
 * ACHADO F-01/01 — **reclassificado no pacote F-01A**: dívida documental, não
 * questão de domínio.
 *
 * O domínio tem **29 conceitos ativos**, e isso está decidido: a **ADR-065**
 * (2026-08-03) instituiu a Compatibilidade Relacional e acrescentou
 * `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` como "a única adição". A migration
 * `20260803100000_catalogo_1_1_0_leitura_relacional.sql` executa a decisão e diz
 * literalmente: *"Insere o 29º conceito"*. Banco e código concordam em 29.
 *
 * Quem está desatualizado é o **documento**: `CONGELAMENTO_ARQUITETURAL.md`
 * (2026-08-01) é **anterior** à ADR-065 e fala em 28 conceitos e catálogo 1.0.0;
 * a Auditoria e a Arquitetura §2.6/§17.1 (A7) repetiram o número.
 *
 * **Encaminhamento correto:** atualizar os documentos para 29 (dívida documental
 * decorrente da ADR-065). **Não existe** a alternativa de reconciliar o código
 * para 28 — isso desfaria uma ADR aprovada.
 *
 * A guarda abaixo protege o número contra mudança silenciosa e verifica, contra
 * as migrations, que o catálogo do código reflete a decisão registrada.
 */
const CONCEITOS_ATIVOS = 29;

const MIGRATION_CATALOGO_1_0_0 = path.join(
  process.cwd(),
  "supabase/migrations/20260802100000_catalogo_canonico_1_0_0.sql",
);
const MIGRATION_CATALOGO_1_1_0 = path.join(
  process.cwd(),
  "supabase/migrations/20260803100000_catalogo_1_1_0_leitura_relacional.sql",
);
const CONCEITO_DA_ADR_065 = "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS";

describe("A-01 · Contagens invioláveis do domínio", () => {
  /**
   * Retificação F-01A (item 5): o teste anterior comparava `PRACTICE_CATALOG`
   * com `SUBCRITERION_CATALOG` — **os dois derivam do mesmo `CATALOGO_GERADO`**,
   * então a igualdade era construída, não observada: o teste não podia falhar.
   * A verificação passa a ser contra a **fonte versionada do banco** (as
   * migrations do catálogo), que é outra fonte de verdade e pode divergir.
   */
  it("todo conceito ativo do código foi semeado por uma migration do catálogo", () => {
    const sql =
      readFileSync(MIGRATION_CATALOGO_1_0_0, "utf8") +
      readFileSync(MIGRATION_CATALOGO_1_1_0, "utf8");

    const ausentes = PRACTICE_CATALOG.map((c) => c.code).filter(
      (code) => !new RegExp(`'${code}'`).test(sql),
    );
    expect(
      ausentes,
      "Conceito existe no código e não foi semeado por migration nenhuma — catálogo editado à mão.",
    ).toEqual([]);
  });

  it("o 29º conceito é o da ADR-065, e entrou pela migration 1.1.0 — não por edição", () => {
    const sql100 = readFileSync(MIGRATION_CATALOGO_1_0_0, "utf8");
    const sql110 = readFileSync(MIGRATION_CATALOGO_1_1_0, "utf8");

    expect(PRACTICE_CATALOG.map((c) => c.code)).toContain(CONCEITO_DA_ADR_065);
    expect(
      new RegExp(`insert into[\\s\\S]*'${CONCEITO_DA_ADR_065}'`).test(sql110),
      "O 29º conceito deveria nascer da migration 1.1.0 (ADR-065).",
    ).toBe(true);
    expect(
      sql100.includes(CONCEITO_DA_ADR_065),
      "O catálogo 1.0.0 não conhecia este conceito — se passar a conhecer, a história foi reescrita.",
    ).toBe(false);
  });

  it("29 conceitos ativos — o número não muda sem ADR (hoje: ADR-065)", () => {
    expect(PRACTICE_CATALOG).toHaveLength(CONCEITOS_ATIVOS);
    expect(SUBCRITERION_CATALOG).toHaveLength(CONCEITOS_ATIVOS);
  });

  it("5 níveis de importância, 3 estados do profissional, 4 resultados", () => {
    expect(IMPORTANCE_LEVELS).toHaveLength(5);
    expect(SUBCRITERION_STATUSES).toHaveLength(3);
    expect(COMPATIBILITY_RESULTS).toHaveLength(4);
  });

  it("15 células, todas preenchidas, todas dentro dos quatro resultados", () => {
    const celulas: string[] = [];
    for (const nivel of IMPORTANCE_LEVELS) {
      for (const estado of SUBCRITERION_STATUSES) {
        const resultado = crossOne(nivel, estado);
        expect(
          COMPATIBILITY_RESULTS,
          `A célula ${nivel}×${estado} devolveu "${resultado}", que não é um dos quatro resultados.`,
        ).toContain(resultado);
        celulas.push(`${nivel}×${estado}`);
      }
    }
    expect(new Set(celulas).size).toBe(15);
  });

  it("12 células relacionais (4 graus × 3 estados), nenhuma vazia", () => {
    expect(NEED_DEGREES).toHaveLength(4);
    let contadas = 0;
    for (const grau of NEED_DEGREES) {
      for (const estado of SUBCRITERION_STATUSES) {
        expect(MATRIZ_RELACIONAL[grau]?.[estado]).toBeDefined();
        contadas += 1;
      }
    }
    expect(contadas).toBe(12);
  });
});

describe("A-02 · Proibição do total combinado", () => {
  it("o resumo de Compatibilidade tem exatamente estes sete campos — nenhum agregado", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: [{ subcriterionCode: "ACESSO_MODALIDADE", importance: "IMPORTANTE" }],
      professionalStates: [{ subcriterionCode: "ACESSO_MODALIDADE", status: "CONFIRMADO" }],
      activeSubcriterionCodes: ["ACESSO_MODALIDADE"],
    });

    expect(Object.keys(leitura.summary).sort()).toEqual(
      [
        "gapsWithoutAnyRecord",
        "highCompatibility",
        "informationGaps",
        "mediumCompatibility",
        "notDeclaredByCase",
        "notRelevant",
        "totalSubcriteria",
      ].sort(),
    );
  });

  it("o resumo Relacional tem exatamente estes cinco campos — nenhum agregado", () => {
    expect(Object.keys(relationalSummary([])).sort()).toEqual(
      ["aguardamJuizo", "altas", "lacunas", "medias", "naoRelevantes"].sort(),
    );
  });

  it("nenhum campo de resumo é nota, score, percentual ou colocação", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: [],
      professionalStates: [],
      activeSubcriterionCodes: [],
    });
    const campos = [...Object.keys(leitura.summary), ...Object.keys(relationalSummary([]))];
    for (const campo of campos) {
      expect(
        /score|nota|pontos|percent|ranking|posicao|media(?!s$)|total(?!Subcriteria$)/i.test(campo),
        `O campo "${campo}" tem nome de agregação. Congelamento §4.8: nenhum score, nenhum total.`,
      ).toBe(false);
    }
  });
});

describe("A-03 · As leituras nunca se somam", () => {
  it("os dois resumos não compartilham nenhuma chave — um spread não os funde", () => {
    const compat = crossPriorityAndProfessional({
      casePriorities: [],
      professionalStates: [],
      activeSubcriterionCodes: [],
    }).summary;
    const relacional = relationalSummary([]);

    const comuns = Object.keys(compat).filter((chave) => chave in relacional);
    expect(
      comuns,
      "Uma chave em comum permite somar as duas leituras por descuido, com um spread.",
    ).toEqual([]);
  });

  it("nenhuma célula de nenhuma das matrizes devolve número", () => {
    for (const nivel of IMPORTANCE_LEVELS) {
      for (const estado of SUBCRITERION_STATUSES) {
        expect(typeof crossOne(nivel, estado)).toBe("string");
      }
    }
    for (const grau of NEED_DEGREES) {
      for (const estado of SUBCRITERION_STATUSES) {
        expect(typeof MATRIZ_RELACIONAL[grau][estado]).toBe("string");
      }
    }
  });
});

describe("A-04 · Nenhum rótulo do domínio julga a pessoa", () => {
  it("os rótulos dos quatro resultados descrevem a leitura, nunca o profissional", () => {
    for (const [resultado, rotulo] of Object.entries(COMPATIBILITY_LABELS)) {
      expect(
        LEXICO_DE_JUIZO.test(rotulo),
        `O rótulo de ${resultado} ("${rotulo}") usa vocabulário de juízo ou de colocação.`,
      ).toBe(false);
    }
  });
});
