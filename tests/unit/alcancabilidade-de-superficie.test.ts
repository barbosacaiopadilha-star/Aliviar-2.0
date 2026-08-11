import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * T-B3-R10 · ALCANÇABILIDADE — não existência.
 *
 * A guarda anterior (`actions-have-callers`) concatenava **todo**
 * `src/components` numa string e perguntava se o nome da action aparecia nela.
 * O arquivo órfão contém a chamada — então **ele satisfazia a própria
 * verificação**. Um componente que ninguém importa provava que a action tinha
 * chamador, e foi assim que `CuradoriaDecisionPanel` ficou fora da rota por
 * todo esse tempo com as suítes verdes (GAP-B3-2, §P do contrato 27).
 *
 * A régua aqui é outra: **o grafo de imports a partir de `src/app`**. Um
 * componente só conta como chamador se alguma página o alcança,
 * transitivamente. Órfão não conta — que é a definição do defeito.
 */

const RAIZ = path.resolve(__dirname, "../..");
const APP = path.join(RAIZ, "src/app");
const SRC = path.join(RAIZ, "src");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

/** Resolve um especificador para um arquivo real do projeto, ou null. */
function resolver(especificador: string, deOnde: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deOnde), especificador);
  else return null; // pacote externo

  for (const tentativa of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    try {
      if (statSync(tentativa).isFile()) return tentativa;
    } catch {
      // caminho inexistente — segue tentando
    }
  }
  return null;
}

function importsDe(arquivo: string): string[] {
  const fonte = readFileSync(arquivo, "utf8");
  const achados: string[] = [];
  for (const re of [/from\s+["']([^"']+)["']/g, /import\(\s*["']([^"']+)["']\s*\)/g]) {
    for (const m of fonte.matchAll(re)) achados.push(m[1]!);
  }
  return achados;
}

/** Tudo o que alguma página de `src/app` alcança, direta ou indiretamente. */
function alcancavelDeApp(): Set<string> {
  const vistos = new Set<string>();
  const fila = arquivos(APP);

  while (fila.length) {
    const atual = fila.pop()!;
    if (vistos.has(atual)) continue;
    vistos.add(atual);

    for (const especificador of importsDe(atual)) {
      const destino = resolver(especificador, atual);
      if (destino && !vistos.has(destino)) fila.push(destino);
    }
  }
  return vistos;
}

const ACTIONS = path.join(SRC, "modules/curadoria/actions.ts");

/**
 * A ÚNICA exceção — e ela é decisão registrada, não conveniência.
 *
 * `MandatoryFilters` chama actions do Perfil de Prioridades
 * (`addPreferenceAction`, `addMandatoryFilterAction`, `removeFilterAction`) e
 * **não é renderizado de propósito**: docs/DECISIONS.md, ADR do Bloco A /
 * decisão **D-04, item 7** — *"NÃO remover. Permanece no código, não
 * renderizado, marcado 'aguardando desenho arquitetural'"*. A relação entre
 * filtros obrigatórios e a Porta de área pós-ADR-042 precisa de desenho
 * próprio antes de publicar ou apagar.
 *
 * Fora do domínio B3: **não chama `registerDecisionAction`** e não toca
 * `patient_curadoria_decisions`.
 *
 * Caminho exato, nunca padrão nem diretório: ampliar esta lista é ato
 * deliberado, e o teste abaixo obriga a que seja.
 */
const EXCECAO_D04 = ["src/components/curadoria/mandatory-filters.tsx"] as const;

function relativo(arquivo: string): string {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

function nomesDasActions(): string[] {
  const fonte = readFileSync(ACTIONS, "utf8");
  return [...fonte.matchAll(/export async function (\w+Action)\b/g)].map((m) => m[1]!);
}

describe("T-B3-R10 · superfícies alcançáveis a partir da rota", () => {
  const alcancaveis = alcancavelDeApp();

  it("o grafo enxerga as páginas e o que elas importam", () => {
    // Sanidade: sem isto, um grafo vazio faria todo o resto passar em falso.
    expect(alcancaveis.size).toBeGreaterThan(50);
    expect([...alcancaveis].some((f) => f.includes(path.join("src", "components")))).toBe(true);
  });

  /**
   * A condição 4 do §P: quem chama uma action de curadoria precisa ser
   * alcançado por `src/app`. Componente órfão que chama action é exatamente
   * o defeito que esta suíte existe para pegar.
   */
  it("todo componente que chama uma action de curadoria é alcançado por alguma página", () => {
    const acoes = nomesDasActions();
    expect(acoes.length, "nenhuma action encontrada — o parser quebrou").toBeGreaterThan(0);

    const componentes = arquivos(path.join(SRC, "components"));
    const orfaos: string[] = [];

    for (const componente of componentes) {
      const fonte = readFileSync(componente, "utf8");
      const chama = acoes.some((acao) => new RegExp(`\\b${acao}\\s*\\(`).test(fonte));
      if (chama && !alcancaveis.has(componente) && !EXCECAO_D04.includes(relativo(componente) as (typeof EXCECAO_D04)[number])) {
        orfaos.push(relativo(componente));
      }
    }

    expect(
      orfaos,
      `superfície órfã: chama action de curadoria e nenhuma página a alcança —\n  ${orfaos.join("\n  ")}`,
    ).toEqual([]);
  });

  /**
   * A exceção não pode crescer em silêncio: se alguém acrescentar um caminho
   * aqui, este teste obriga a explicar por quê — e a exceção continua sendo
   * exatamente uma, com nome completo.
   */
  it("a exceção do D-04 é exatamente uma, e é a que a ADR nomeia", () => {
    expect(
      EXCECAO_D04,
      "a allowlist cresceu — toda exceção nova exige decisão registrada, como a D-04",
    ).toEqual(["src/components/curadoria/mandatory-filters.tsx"]);

    // E ela precisa continuar existindo: se o arquivo sumir, a exceção vira
    // letra morta e deve sair junto.
    expect(
      arquivos(path.join(SRC, "components")).map(relativo),
    ).toContain(EXCECAO_D04[0]);
  });

  it("a superfície canônica da decisão é alcançada pela rota da paciente", () => {
    const painel = path.join(SRC, "components/patient/curadoria-decision-panel.tsx");

    expect(
      alcancaveis.has(painel),
      "CuradoriaDecisionPanel voltou a ficar órfão — a decisão canônica perdeu a porta",
    ).toBe(true);
  });
});
