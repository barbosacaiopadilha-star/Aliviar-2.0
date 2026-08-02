import { readFileSync } from "node:fs";
import path from "node:path";
import { globSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A paleta única — guardas da reconvergência da identidade visual.
 *
 * Estes testes nascem de uma deriva que já aconteceu: entre a ADR-017 (que
 * fixou `#123B67` como azul institucional) e a auditoria de 2026-08-01, a
 * implementação perdeu o azul da marca inteiro. Nenhuma decisão fez isso —
 * três arquivos declararam paletas próprias, cada uma defensável sozinha, e
 * juntas apagaram a identidade.
 *
 * São testes de fonte porque o que se protege é a estrutura do Design System,
 * não comportamento: a fundação como única origem de cor, a camada interna
 * como território privado, e a ausência deliberada de um vocabulário de
 * semáforo.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf-8");
}

const GLOBALS = read("src/app/globals.css");

/**
 * Comentários citam de propósito os hexadecimais e as declarações que
 * causaram a deriva. A memória do que deu errado é parte da guarda — não pode
 * ser lida como a violação que ela documenta.
 */
function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** As folhas escopadas por ambiente — as três paletas concorrentes de antes. */
const FOLHAS_DE_AMBIENTE = [
  "src/app/patient-dashboard.css",
  "src/app/landing-editorial.css",
  "src/app/mesa-curador.css",
];

describe("Paleta única — a fundação é a única origem de cor", () => {
  it("as âncoras canônicas da ADR-017 estão na camada interna", () => {
    // Se um arquivo-fonte oficial da marca trouxer hexadecimais diferentes,
    // ele prevalece (ADR-017) — mas a troca passa a ser deliberada e visível
    // aqui, nunca uma deriva silenciosa como a que originou este teste.
    expect(GLOBALS).toContain("--scale-indigo-700: #123b67");
    expect(GLOBALS).toContain("--scale-indigo-800: #0e2f52");
    expect(GLOBALS).toContain("--scale-sage-300: #a8c0ae");
    expect(GLOBALS).toContain("--scale-sage-500: #7f9e8c");
  });

  it("o azul institucional é a cor de marca — não um verde", () => {
    expect(GLOBALS).toContain("--color-brand-primary: var(--scale-indigo-700)");
  });

  it("os aprendizados do verde continuam na paleta", () => {
    // O verde legível e o verde-floresta nasceram do período de deriva e
    // foram incorporados de propósito: reconverger não é apagar o aprendido.
    expect(GLOBALS).toContain("--scale-sage-700: #556b5d");
    expect(GLOBALS).toContain("--scale-sage-900: #1a2e26");
  });

  it("nenhuma folha de ambiente redeclara cor, elevação, raio ou duração", () => {
    // Era exatamente assim que a plataforma tinha três identidades: cada
    // cômodo declarando a própria. Um ambiente escolhe atmosfera, nunca paleta.
    const proibidos = [
      "--color-brand-primary:",
      "--color-brand-sage:",
      "--color-ink:",
      "--color-border:",
      "--color-bg-canvas:",
      "--color-focus-ring:",
      "--shadow-sm:",
      "--shadow-md:",
      "--shadow-lg:",
      "--radius-sm:",
      "--radius-md:",
      "--radius-lg:",
      "--duration-fast:",
      "--duration-base:",
      "--duration-slow:",
    ];
    for (const folha of FOLHAS_DE_AMBIENTE) {
      const css = semComentarios(read(folha));
      for (const token of proibidos) {
        expect(css, `${folha} redeclara ${token}`).not.toContain(token);
      }
    }
  });

  it("nenhuma folha de ambiente carrega cor literal", () => {
    // Hexadecimais e rgb() avulsos são como a deriva começa: um valor que
    // ninguém consegue rastrear até uma decisão.
    for (const folha of FOLHAS_DE_AMBIENTE) {
      // A textura de papel é um SVG embutido em escala de cinza, sem cor.
      const css = semComentarios(read(folha)).replace(/--texture-paper:[^;]+;/g, "");
      const literais = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g) ?? [];
      expect(literais, `${folha} tem cor literal: ${literais.join(", ")}`).toHaveLength(0);
    }
  });
});

describe("Modificador de opacidade sobre token — o padrão que não compila", () => {
  it("nenhum `token/NN` do Tailwind sobre cor de var() em src/", () => {
    // A forma `bg-brand-gold/40` parece válida e NÃO gera utilidade nenhuma:
    // tokens definidos como `var(--x)` não têm canal alfa, o Tailwind v3
    // descarta a classe em silêncio, e o elemento cai no fallback do
    // navegador. Foi assim que o caminho percorrido da Recepção ficou
    // invisível e o anel de foco ficou azul de fábrica (rgba(59,130,246,.5))
    // — 110 ocorrências corrigidas na validação 2.4. A sintaxe de opacidade
    // sobre cores NATIVAS do Tailwind (`bg-white/60`) continua permitida:
    // esta guarda é específica aos tokens da casa.
    const TOKENS = [
      "brand-primary-darkest", "brand-primary-deep", "brand-sage-light",
      "brand-sage-deep", "brand-primary", "brand-sage", "brand-gold",
      "attention-surface", "attention", "accent-soft", "accent-deep",
      "on-dark-muted", "on-dark-faint", "on-dark-line", "on-dark",
      "border-strong", "ink-muted", "success-surface", "warning-surface",
      "error-surface", "retrato-1", "retrato-2", "retrato-3", "accent",
      "border", "canvas", "surface", "recessed", "ambient", "focus",
      "success", "warning", "error", "ink",
    ];
    const UTILS =
      "bg|text|border|ring-offset|ring|divide|from|via|to|placeholder|decoration|outline|caret|fill|stroke";
    const RE = new RegExp(
      `\\b(?:${UTILS})-(?:${TOKENS.join("|")})/\\d{1,3}\\b`,
      "g",
    );
    const semComentariosTsx = (code: string) =>
      code
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

    const arquivos = [
      ...globSync("src/**/*.tsx", { cwd: ROOT }),
      ...globSync("src/**/*.ts", { cwd: ROOT }),
      ...globSync("src/**/*.css", { cwd: ROOT }),
    ];
    const infracoes: string[] = [];
    for (const f of arquivos) {
      const conteudo = semComentariosTsx(read(f));
      const achados = conteudo.match(RE) ?? [];
      for (const a of achados) infracoes.push(`${f} → ${a}`);
    }
    expect(
      infracoes,
      `modificador de opacidade sobre token (não compila — use color-mix):\n${infracoes.join("\n")}`,
    ).toHaveLength(0);
  });
});

describe("Camada interna — as escalas são privadas", () => {
  it("nenhum componente de produto lê --scale-* diretamente", () => {
    // A camada interna existe para consistência e evolução. Se um componente
    // puder alcançá-la, o degrau vira decisão local e a semântica se perde.
    const arquivos = globSync("src/{components,app,modules}/**/*.{tsx,ts}", { cwd: ROOT });
    const infratores = arquivos.filter((f) => read(f).includes("--scale-"));
    expect(infratores, `componentes lendo a camada interna: ${infratores.join(", ")}`).toHaveLength(0);
  });
});

describe("Ausência deliberada — a proteção é o que o sistema não oferece", () => {
  it("não existe escala cromática de estado (success/danger/error)", () => {
    // F2 §13.2, Nível 2: um token chamado `success` será usado como sucesso,
    // e sucesso puxa erro, e erro puxa vermelho — o semáforo que a R2 proíbe.
    // Os três tokens operacionais herdados continuam existindo, sem escala;
    // o que não pode nascer é uma FAMÍLIA deles.
    expect(GLOBALS).not.toMatch(/--scale-(success|danger|error|warning)/);
    expect(GLOBALS).not.toMatch(/--color-(success|danger|error|warning)-\d{2,3}\b/);
  });

  it("a condição humana tem nome próprio, e não é `warning`", () => {
    expect(GLOBALS).toContain("--color-attention:");
    expect(GLOBALS).toContain("--color-attention-surface:");
  });
});

describe("Contraste — acessibilidade prevalece sobre estética", () => {
  it("o sálvia de marca nunca carrega texto", () => {
    // `--color-brand-sage` (#7f9e8c) tem 2,76:1 sobre o papel: reprova AA com
    // folga. A ADR-017 já o proibia como texto; o código o usava assim em
    // quinze lugares. O verde legível é o `-deep` (5,43:1).
    const arquivos = globSync("src/{components,app}/**/*.tsx", { cwd: ROOT });
    const infratores = arquivos.filter((f) => /\btext-brand-sage(?!-)/.test(read(f)));
    expect(infratores, `sálvia como texto em: ${infratores.join(", ")}`).toHaveLength(0);

    for (const folha of FOLHAS_DE_AMBIENTE) {
      expect(read(folha), `${folha} usa sálvia como cor de texto`).not.toMatch(
        /\n\s*color: var\(--color-brand-sage\);/,
      );
    }
  });
});

describe("A narrativa cromática vive num lugar só", () => {
  it("os ambientes são declarados na fundação, não espalhados", () => {
    for (const ambiente of [
      ".landing-editorial",
      ".patient-dashboard",
      ".ambiente-curadoria",
      ".ambiente-decisao",
      ".ambiente-concierge",
    ]) {
      expect(GLOBALS, `${ambiente} não declara atmosfera na fundação`).toContain(`${ambiente} {`);
    }
  });

  it("a Curadoria é o ambiente verde; os demais, azuis", () => {
    // R19: azul é o que a Aliviar comunica, verde é o que avançou no tempo.
    // Se a Curadoria virar azul, a jornada inteira fica monocromática de novo.
    const curadoria = GLOBALS.slice(GLOBALS.indexOf(".ambiente-curadoria {"));
    expect(curadoria.slice(0, 400)).toContain("--color-ambient-accent: var(--scale-sage-700)");
  });
});
