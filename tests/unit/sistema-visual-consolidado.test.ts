import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * As guardas da consolidação (Onda 6).
 *
 * Cada caso aqui protege um resíduo que a Auditoria da Experiência Visual
 * encontrou e esta onda eliminou. São testes de fonte porque o que se
 * protege é material e vocabulário — coisas que voltam por decisão local
 * razoável ("só um badge em caixa alta", "só um blurzinho no header") e que
 * ninguém percebe uma a uma.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf-8");
}

/**
 * O que o navegador recebe — comentários explicam decisões e citam o que foi
 * corrigido, e citar um resíduo não é reintroduzi-lo.
 */
function semComentarios(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel, acc);
    else if (/\.(tsx?|css)$/.test(entry)) acc.push(rel);
  }
  return acc;
}

/**
 * Os shells vivos — a moldura que a pessoa vê em toda superfície.
 *
 * ERAM CINCO. A **ADR-098** abriu UMA exceção, nomeada e estreita: o cabeçalho
 * público da Fachada passa a poder usar vidro, porque ele flutua sobre
 * fotografia de tela cheia e a moldura opaca cortava a cena. Os quatro abaixo
 * continuam proibidos — e é justamente por isso que a exceção não dissolve a
 * regra: ela tem nome, motivo e fronteira.
 */
const SHELLS = [
  "src/components/paciente/patient-shell.tsx",
  "src/components/shell/app-shell.tsx",
  "src/components/curadoria/portal-shell.tsx",
  "src/app/mesa-curador.css",
];

/** A única superfície de moldura autorizada a usar vidro (ADR-098). */
const SHELL_DE_VIDRO_AUTORIZADO = "src/components/landing/public-header.tsx";

describe("Materiais — nenhum vidro na casa", () => {
  it("nenhum shell vivo usa blur de fundo", () => {
    for (const shell of SHELLS) {
      const fonte = semComentarios(read(shell));
      expect(fonte, `blur residual em ${shell}`).not.toMatch(/backdrop-blur|backdrop-filter/);
    }
  });

  /**
   * A exceção da ADR-098 é UMA. Este caso existe para que abrir a segunda
   * exija passar por aqui — e por uma decisão registrada — em vez de acontecer
   * por somatório de escolhas locais razoáveis, que é exatamente como uma casa
   * inteira vira vidro sem ninguém ter decidido isso.
   */
  it("a exceção de vidro é uma só, e é a que a ADR-098 nomeia", () => {
    expect(SHELLS).not.toContain(SHELL_DE_VIDRO_AUTORIZADO);
    expect(SHELLS).toHaveLength(4);

    const fachada = semComentarios(read(SHELL_DE_VIDRO_AUTORIZADO));
    expect(
      fachada,
      "a exceção existe para ser usada; se o vidro saiu do cabeçalho, feche a exceção",
    ).toMatch(/backdrop-blur|backdrop-filter/);
  });

  it("o cartão da paciente é papel opaco, nunca vidro", () => {
    const css = read("src/app/patient-dashboard.css");
    const bloco = css.slice(css.indexOf(".patient-card {"), css.indexOf(".patient-card--note"));
    expect(bloco).not.toContain("backdrop-filter");
    expect(bloco).not.toContain("linear-gradient");
  });
});

describe("Tipografia — nada grita", () => {
  it("Badge não vem em caixa alta por padrão", () => {
    const badge = read("src/components/ui/badge.tsx");
    expect(badge).not.toContain("uppercase");
  });

  it("a Mesa do Curador não usa caixa alta", () => {
    expect(read("src/app/mesa-curador.css")).not.toContain("text-transform: uppercase");
  });
});

describe("Tokens — um vocabulário só", () => {
  it("nenhuma superfície usa text-muted-foreground; o token da casa é text-ink-muted", () => {
    const arquivos = [...walk("src/components"), ...walk("src/app")];
    const infratores = arquivos.filter((f) => semComentarios(read(f)).includes("text-muted-foreground"));
    expect(infratores, `token estrangeiro em: ${infratores.join(", ")}`).toEqual([]);
  });

  it("nenhuma superfície viva se apresenta como um sistema", () => {
    const arquivos = [...walk("src/components"), ...walk("src/app")];
    const infratores = arquivos.filter((f) => semComentarios(read(f)).includes("Sistema Operacional"));
    expect(infratores).toEqual([]);
  });
});

describe("Mesa do Curador — toda classe semântica existe no CSS", () => {
  const css = read("src/app/mesa-curador.css");

  /**
   * Contêineres sem estilo próprio, mantidos como marcação semântica: não
   * carregam significado visual e por isso não precisam de regra. Estão
   * nomeados aqui em vez de removidos — a lista é o registro da decisão.
   */
  const ESTRUTURAIS = new Set([
    "mesa-comparacao",
    "mesa-filtros",
    "mesa-dupla",
    "mesa-step__label",
  ]);

  it("todo modificador de estado emitido pela Mesa tem definição", () => {
    const componentes = walk("src/components/curadoria").filter((f) => f.endsWith(".tsx"));
    const emitidos = new Set<string>();

    for (const arquivo of componentes) {
      const fonte = semComentarios(read(arquivo));
      // Modificadores literais: "mesa-algo--estado"
      for (const match of fonte.matchAll(/["'`](mesa-[a-z]+(?:__[a-z]+)?--[a-z-]+)["'`]/g)) {
        emitidos.add(match[1]!);
      }
      // Modificadores por template: `mesa-algo--${x}` — resolvidos pelos
      // valores possíveis declarados no próprio módulo de tipos.
    }

    for (const classe of emitidos) {
      if (ESTRUTURAIS.has(classe)) continue;
      expect(css, `classe emitida sem definição: ${classe}`).toContain(`.${classe}`);
    }
  });

  it("os estados das duas linhas do tempo estão todos definidos", () => {
    // Emitidos por template (`--${status}`), invisíveis ao grep literal.
    for (const classe of [
      ".mesa-timeline__item--done",
      ".mesa-timeline__item--current",
      ".mesa-timeline__item--ahead",
      ".mesa-raciocinio__item--percorrida",
      ".mesa-raciocinio__item--agora",
      ".mesa-raciocinio__item--adiante",
    ]) {
      expect(css, `estado sem tratamento no CSS: ${classe}`).toContain(classe);
    }
  });
});

describe("Estados vazios — só quando a ausência é verdadeira", () => {
  it("a saudação dos fundos não afirma vazio sobre conteúdo real", () => {
    const painel = semComentarios(read("src/components/shell/dashboard-panel.tsx"));
    expect(painel).not.toContain("EmptyState");
    expect(painel).not.toContain("Ainda não há informações");
  });
});
