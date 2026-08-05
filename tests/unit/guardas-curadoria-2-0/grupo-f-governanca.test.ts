import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  CATALOGO_GERADO,
  CATALOGO_GERADO_HASH,
  CATALOGO_VERSAO,
} from "@/modules/curadoria/catalogo-gerado";
import { PRACTICE_CATALOG } from "@/modules/curadoria/evidencias-pratica";
import { crossPriorityAndProfessional } from "@/modules/curadoria/motor-compatibilidade";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO F: GOVERNANÇA
 *
 * ┌ F-01 — Todo conceito ativo declara sua participação no Motor
 * │ Objetivo ......... nenhum conceito entra em circulação sem que alguém tenha
 * │                    decidido se ele participa do Motor.
 * │ Princípio ........ Congelamento §4.3; Arquitetura §4.3 item 2.
 * │ Arquivos ......... evidencias-pratica.ts (MOTOR_PARTICIPATION)
 * │ Validação ........ todo conceito ativo tem `motor` num dos três valores.
 * │ Falha ............ um conceito novo nasce sem decisão de Motor.
 * ├ F-02 — O catálogo não muda em silêncio
 * │ Princípio ........ Congelamento §2 (catálogo congelado); I-3 (um catálogo
 * │                    com autoridade).
 * │ Validação ........ versão e hash pinados.
 * └ F-03 — CARACTERIZAÇÃO DP-1 / achado P15 — **não é guarda, é evidência**
 *   Ver o bloco de comentário sobre a caracterização, abaixo.
 */

describe("F-01 · Todo conceito ativo declara participação no Motor", () => {
  it("nenhum conceito ativo circula sem decisão de participação", () => {
    for (const conceito of PRACTICE_CATALOG) {
      expect(
        ["DIRETO", "INDIRETO", "NUNCA"],
        `O conceito ${conceito.code} declara participação "${conceito.motor}", fora do vocabulário.`,
      ).toContain(conceito.motor);
    }
  });

  it("os conceitos marcados NUNCA são exatamente estes quatro — mudar a lista exige decisão", () => {
    const nunca = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA")
      .map((c) => c.code)
      .sort();
    expect(nunca).toEqual([
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "VIABILIDADE_COBERTURA_E_CONVENIO",
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
    ]);
  });
});

/**
 * F-02 · **Corrigida no pacote F-01A (item 4).**
 *
 * A versão anterior comparava `CATALOGO_GERADO_HASH` com um literal copiado do
 * **mesmo arquivo**. Era proteção aparente: detectava regeneração do catálogo,
 * mas **não** detectava o caso que importa — alguém editar `CATALOGO_GERADO` à
 * mão sem regenerar, deixando o hash declarado intacto e mentindo sobre o
 * conteúdo.
 *
 * A guarda passa a **recomputar** o hash a partir do conteúdo real, com o mesmo
 * algoritmo do gerador (`scripts/gerar-catalogo-ts.mjs` → `hashDaCarga`:
 * `sha256(JSON.stringify(carga))`).
 *
 * O QUE ELA PROTEGE: edição manual de `catalogo-gerado.ts`. Qualquer alteração no
 * conteúdo sem regeneração deixa o hash declarado incoerente, e o teste falha.
 *
 * O QUE ELA **NÃO** PROTEGE: divergência entre o arquivo e o **banco**. Se alguém
 * alterar o banco e regenerar o arquivo, os dois ficam coerentes entre si e esta
 * guarda passa — corretamente, porque a decisão de catálogo é de outra instância.
 * Essa paridade é responsabilidade de `tests/remediacao/paridade-catalogo.integration.test.ts`,
 * que recomputa a carga do banco vivo. **Guarda de unidade não substitui a de
 * integração**; as duas cobrem camadas diferentes, e é por isso que ambas existem.
 */
describe("F-02 · O catálogo não muda em silêncio", () => {
  it("o hash declarado corresponde ao conteúdo real do catálogo", () => {
    const recomputado = createHash("sha256")
      .update(JSON.stringify(CATALOGO_GERADO))
      .digest("hex");

    expect(
      recomputado,
      "O conteúdo de catalogo-gerado.ts não corresponde ao hash declarado — o arquivo foi editado à mão. " +
        "Regenere com scripts/gerar-catalogo-ts.mjs a partir do banco.",
    ).toBe(CATALOGO_GERADO_HASH);
  });

  it("a versão vigente do catálogo é a da ADR-065 e não muda sem decisão", () => {
    expect(CATALOGO_VERSAO).toBe("1.1.0");
    for (const conceito of CATALOGO_GERADO.filter((c) => c.active)) {
      expect(
        conceito.catalogVersion,
        `${conceito.code} está ativo declarando versão ${conceito.catalogVersion}, fora da vigência única.`,
      ).toBe(CATALOGO_VERSAO);
    }
  });
});
/**
 * F-03 · GUARDA A4 — CONCEITO `NUNCA` NUNCA APARECE EM CRUZAMENTO.
 *
 * ATÉ O ITEM 1.1, AQUI HAVIA UMA CARACTERIZAÇÃO, NÃO UMA GUARDA.
 *
 * Ela registrava o achado P15 de forma executável: o Congelamento §4.3 dizia
 * que viabilidade e preferências NUNCA entram no Motor, `MOTOR_PARTICIPATION`
 * marcava quatro conceitos assim, e o Motor cruzava os quatro assim mesmo. O
 * bloco passava PORQUE descrevia o defeito, e prometia ficar vermelho no dia em
 * que alguém implementasse a guarda — para que a correção não passasse calada.
 *
 * Ficou vermelho. A DP-1 foi ratificada, o Item 1.1 implementou a guarda em dois
 * níveis, e este bloco cumpre o destino que ele mesmo escreveu: deixa de
 * descrever o defeito e passa a impedir seu retorno.
 */
describe("F-03 · Guarda A4 — MOTOR_PARTICIPATION = NUNCA é executável", () => {
  const CONCEITOS_NUNCA = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA").map((c) => c.code);

  it("os quatro conceitos marcados NUNCA existem e são conhecidos", () => {
    expect(CONCEITOS_NUNCA).toHaveLength(4);
  });

  it("nenhum deles aparece no cruzamento, nem com Mapa e estado completos", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: CONCEITOS_NUNCA.map((code) => ({
        subcriterionCode: code,
        importance: "MUITO_IMPORTANTE" as const,
      })),
      professionalStates: CONCEITOS_NUNCA.map((code) => ({
        subcriterionCode: code,
        status: "CONFIRMADO" as const,
      })),
      activeSubcriterionCodes: CONCEITOS_NUNCA,
    });

    expect(leitura.rows).toEqual([]);
    expect(leitura.summary.totalSubcriteria).toBe(0);
    expect(leitura.summary.highCompatibility).toBe(0);
    // E não sobram como "ainda não declarados": eles não estão pendentes de
    // declaração nenhuma — estão fora do Motor.
    expect(leitura.summary.notDeclaredByCase).toBe(0);
  });

  it("o Motor CONSULTA a participação antes de cruzar", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const fonte = readFileSync(
      path.join(process.cwd(), "src/modules/curadoria/motor-compatibilidade.ts"),
      "utf8",
    );

    expect(fonte).toContain("apenasConceitosDoMotor");
    expect(fonte).toContain("participaDoMotor");
    expect(fonte).toContain("celulaDoMotor");
  });
});