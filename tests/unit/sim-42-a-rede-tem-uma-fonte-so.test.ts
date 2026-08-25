import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A REDE TEM UMA FONTE SÓ — `SIM-42`.
 *
 * @metodo ADR-088 — só fato verificado elimina; a proveniência viaja com o fato
 * @metodo ADR-066/11-08 — duas superfícies para o mesmo ato é a segunda fonte
 * @metodo Fundamentos §13 — P6: o universo é fechado e previamente aprovado
 *
 * ESTE DEFEITO JÁ VOLTOU UMA VEZ, e é por isso que a guarda existe.
 *
 * Na primeira, foi a Mesa antiga: ela montava a própria consulta de Rede e a
 * exclusão por divergência crítica ficava de fora. O achado foi a `NC-22`, e a
 * correção criou `rede-policy.ts` — cujo cabeçalho diz, com todas as letras,
 * *"dois universos para a mesma pergunta"*.
 *
 * Na segunda, foi a Mesa nova: uma consulta a `professional_profiles` por
 * `publication_status`, sem `is_demo`, sem `is_test_fixture` e sem a lista de
 * bloqueio. E dessa vez com consequência maior, porque a Mesa nova já compõe
 * os três e já emite: um profissional com divergência crítica em aberto podia
 * chegar ao relatório de uma paciente, e `validateSelection` só confere
 * "exatamente três, sem repetido".
 *
 * Eliminar é o ato mais pesado que a Mesa pratica, e é o único cujo efeito a
 * paciente nunca poderá auditar — ela jamais fica sabendo do caminho que não
 * lhe foi apresentado. Incluir quem a Rede não deveria oferecer é o mesmo erro
 * pelo avesso.
 *
 * A guarda é de código-fonte de propósito: o risco não é de cálculo, é de
 * ALGUÉM ESCREVER UMA SEGUNDA CONSULTA. Nenhum teste de comportamento pega
 * isso, porque a segunda consulta se comporta perfeitamente — só que sobre
 * outro universo.
 */

const RAIZ = process.cwd();
const SRC = path.join(RAIZ, "src");
const PORTAL_DO_CURADOR = path.join(SRC, "app/portal-curador");
const MESA_NOVA = path.join(SRC, "app/portal-curador/casos/[id]/mesa/page.tsx");

const CONSULTA_A_REDE = 'from("professional_profiles")';

/**
 * QUEM TEM DIREITO DE MONTAR UMA REDE DE CURADORIA — e por que é uma lista.
 *
 * Estes dois selecionam profissionais por ciclo de vida para OFERECÊ-LOS a uma
 * paciente, e os dois subtraem a lista de bloqueio. Um terceiro não é proibido
 * — é uma decisão, e decisão em silêncio foi exatamente o que produziu o
 * `SIM-42`. Quem acrescentar um nome aqui está declarando que leu esta regra.
 */
const MONTAM_REDE = [
  "src/modules/curadoria/mesa-cruzamento.ts",
  "src/modules/curadoria/repository.ts",
];

/**
 * Estes tocam `professional_profiles` filtrando por ciclo, e NÃO montam Rede:
 * são cadastro e ciclo de vida do profissional, do lado do Administrador.
 * Ficam listados para que a conta feche e ninguém precise adivinhar.
 */
const NAO_MONTAM_REDE = [
  "src/modules/profiles/ciclo-do-profissional-actions.ts",
  "src/modules/profiles/professional-repository.ts",
];

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

function relativo(completo: string): string {
  return path.relative(RAIZ, completo).split(path.sep).join("/");
}

/** O texto sem comentários — para não confundir a menção com o ato. */
function codigo(completo: string): string {
  return readFileSync(completo, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("A Rede tem uma fonte só — nenhuma tela monta a sua", () => {
  it("nenhuma rota do portal do Curador consulta a Rede por conta própria", () => {
    const infratores = arquivos(PORTAL_DO_CURADOR)
      .filter((arquivo) => codigo(arquivo).includes(CONSULTA_A_REDE))
      .map(relativo);

    expect(
      infratores,
      "Uma tela do Curador voltou a montar a própria Rede. A política vive em " +
        "`rede-policy.ts` e a Rede se lê por `loadMesaCruzamento` — ver SIM-42 e NC-22.",
    ).toEqual([]);
  });

  it("a Mesa nova lê a Rede canônica, e é assim que ela obtém as colunas", () => {
    const fonte = codigo(MESA_NOVA);

    expect(fonte).toContain("loadMesaCruzamento");
    // As colunas são os elegíveis: comparar quem não passou pela porta da área
    // produziria comparação sobre a qual o Curador poderia agir (ADR-042).
    expect(fonte).toContain('eligibility.state === "ELEGIVEL"');
  });

  it("todo montador de Rede subtrai a lista de bloqueio por divergência crítica", () => {
    for (const arquivo of MONTAM_REDE) {
      const fonte = codigo(path.join(RAIZ, arquivo));

      expect(fonte, `${arquivo} monta Rede`).toContain(CONSULTA_A_REDE);
      expect(
        fonte,
        `${arquivo} monta Rede e não consulta a lista de bloqueio — foi assim que a NC-22 aconteceu`,
      ).toContain("listCriticalDivergenceBlocklist");
    }
  });

  // A conta que fecha: quem filtra profissionais por ciclo de vida ou monta
  // Rede, ou é cadastro. Um arquivo novo aqui obriga alguém a dizer qual dos
  // dois é — e é essa a decisão que faltou no SIM-42.
  it("nenhum montador de Rede novo aparece sem alguém declarar que é um", () => {
    const filtramPorCiclo = arquivos(SRC)
      .filter((arquivo) => {
        const fonte = codigo(arquivo);
        return fonte.includes(CONSULTA_A_REDE) && fonte.includes("ciclo_de_vida");
      })
      .map(relativo)
      .sort();

    expect(
      filtramPorCiclo,
      "Apareceu um arquivo novo filtrando profissionais por ciclo de vida. " +
        "Se ele oferece profissionais a uma paciente, é montador de Rede: some " +
        "a lista de bloqueio e acrescente-o a MONTAM_REDE. Se é cadastro, " +
        "acrescente-o a NAO_MONTAM_REDE. O que não pode é entrar em silêncio.",
    ).toEqual([...MONTAM_REDE, ...NAO_MONTAM_REDE].sort());
  });
});
