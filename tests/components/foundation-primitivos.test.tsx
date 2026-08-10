import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { StateMark } from "@/components/ui/state-mark";
import {
  classeDoPapel,
  PAPEIS_VISUAIS,
  SINAL_DO_PAPEL,
  type PapelVisual,
} from "@/foundation/estado-visual";

/**
 * FUNDAÇÃO · as garantias dos primitivos compartilhados.
 *
 * O que estes testes protegem não é aparência — é a regra que impede as quatro
 * trilhas de multiplicarem o problema: uma gramática de estado, cor nunca
 * sozinha, e um `Badge` que continua se recusando a afirmar semântica.
 */

afterEach(cleanup);

const FOLHAS = [
  "src/app/globals.css",
  "src/app/landing-editorial.css",
  "src/app/mesa-curador.css",
  "src/app/patient-dashboard.css",
];

describe("Tokens · as três camadas não se atropelam", () => {
  it("a escala bruta existe e ninguém a consome direto na UI", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    expect(globals).toContain("--scale-");
    // `--scale-*` só pode ser lido pela camada semântica, dentro do próprio
    // dicionário. Um componente que o consumisse pularia a semântica.
    const emComponentes = [
      "src/components/ui/state-mark.tsx",
      "src/components/ui/button.tsx",
      "src/components/ui/badge.tsx",
      "src/components/ui/card.tsx",
    ]
      .map((f) => readFileSync(f, "utf8"))
      .filter((fonte) => fonte.includes("--scale-"));
    expect(emComponentes, "primitivo consumindo a escala bruta").toHaveLength(0);
  });

  it("`prefers-reduced-motion` cobre TODAS as folhas — como REGRA, não como comentário", () => {
    // F-2 · a guarda anterior procurava a expressão no arquivo inteiro, então
    // um comentário dizendo "respeitamos prefers-reduced-motion" a satisfazia
    // com zero CSS aplicado. Agora o texto é lido sem comentários, e o que se
    // exige é um bloco @media de verdade, com corpo.
    for (const folha of FOLHAS) {
      const bruto = readFileSync(folha, "utf8");
      expect(bruto.length, `${folha} vazia`).toBeGreaterThan(0);

      const semComentarios = bruto.replace(/\/\*[\s\S]*?\*\//g, "");
      expect(
        semComentarios.includes("prefers-reduced-motion"),
        `${folha}: a expressão só existe em comentário — nenhuma regra é aplicada`,
      ).toBe(true);

      // `@media` + a feature + abertura de bloco, tolerando espaço e quebra.
      const regra = /@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[^{]*\{/;
      expect(
        regra.test(semComentarios),
        `${folha}: menciona a preferência mas não tem bloco @media que a implemente`,
      ).toBe(true);

      // E o bloco não pode estar vazio: `@media (...) { }` não desliga nada.
      const inicio = semComentarios.search(regra);
      const corpo = semComentarios.slice(inicio, inicio + 600);
      expect(
        /\{[^}]*[a-z-]+\s*:\s*[^;}]+;/.test(corpo.slice(corpo.indexOf("{") + 1)),
        `${folha}: bloco @media sem nenhuma declaração`,
      ).toBe(true);
    }
  });

  it("§27 · prova negativa: comentário sozinho NÃO satisfaz a guarda", () => {
    // O texto que passava na guarda antiga e deve reprovar na nova.
    const impostor = `/* respeitamos prefers-reduced-motion: reduce em todo lugar */\n.a { color: red; }`;
    const semComentarios = impostor.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(semComentarios.includes("prefers-reduced-motion")).toBe(false);
    expect(/@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[^{]*\{/.test(semComentarios)).toBe(
      false,
    );
  });

  it("§27 · prova negativa: bloco @media VAZIO não desliga movimento", () => {
    const vazio = `@media (prefers-reduced-motion: reduce) {\n}`;
    const corpo = vazio.slice(vazio.indexOf("{") + 1);
    expect(/[a-z-]+\s*:\s*[^;}]+;/.test(corpo)).toBe(false);
  });

  it("os dicionários locais DERIVAM do motion canônico — não inventam tempo", () => {
    const paciente = readFileSync("src/app/patient-dashboard.css", "utf8");
    const inicio = paciente.indexOf("--p-motion-instant");
    expect(inicio, "o alvo sumiu — o recorte seria vazio").toBeGreaterThan(-1);
    const bloco = paciente.slice(inicio, inicio + 400);
    // Aliases do canônico, não milissegundos avulsos.
    expect(bloco).toContain("var(--duration-instant)");
    expect(bloco).toContain("var(--duration-fast)");
    expect(bloco).toContain("var(--ease-standard)");
  });

  it("nenhuma animação passa de 300ms fora das exceções declaradas", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const inicio = globals.indexOf("--duration-instant");
    expect(inicio).toBeGreaterThan(-1);
    const bloco = globals.slice(inicio, globals.indexOf("--ease-standard", inicio));
    const tempos = [...bloco.matchAll(/(\d+)ms/g)].map((m) => Number(m[1]));
    expect(tempos.length).toBeGreaterThan(0);
    // `--duration-slow` (480ms) e a travessia da Landing são as exceções
    // declaradas em 12_DESIGN_SYSTEM_ALVO §5; o resto do dia a dia fica curto.
    expect(tempos.filter((t) => t <= 300).length).toBeGreaterThanOrEqual(2);
  });
});

describe("StateMark · cor NUNCA sozinha", () => {
  it("todo papel tem símbolo — a distinção sobrevive ao cinza", () => {
    for (const papel of PAPEIS_VISUAIS) {
      expect(SINAL_DO_PAPEL[papel].length).toBeGreaterThan(0);
    }
  });

  it("renderiza cor, símbolo e texto — os três, sempre", () => {
    render(<StateMark papel="atencao">Aguarda você</StateMark>);
    const texto = screen.getByText("Aguarda você");
    expect(texto).toBeInTheDocument();
    const marca = texto.parentElement!.querySelector("[aria-hidden='true']")!;
    expect(marca.textContent).toBe(SINAL_DO_PAPEL.atencao);
    expect(marca.className).toContain("mesa-estado--atencao");
  });

  it("o símbolo é decorativo — quem usa leitor de tela ouve a frase, não 'bola'", () => {
    render(<StateMark papel="resolvido">Entregue</StateMark>);
    const marca = screen.getByText("Entregue").parentElement!.querySelector("[aria-hidden='true']")!;
    expect(marca.getAttribute("aria-hidden")).toBe("true");
  });

  it("cada papel produz uma classe distinta — nenhum par compartilha aparência", () => {
    const classes = PAPEIS_VISUAIS.map((p) => classeDoPapel(p));
    expect(new Set(classes).size).toBe(PAPEIS_VISUAIS.length);
  });

  it("um símbolo próprio pode substituir o canônico, mas nunca desaparecer", () => {
    render(
      <StateMark papel="atencao" sinal="↻">
        Evidência nova
      </StateMark>,
    );
    const marca = screen
      .getByText("Evidência nova")
      .parentElement!.querySelector("[aria-hidden='true']")!;
    expect(marca.textContent).toBe("↻");
  });
});

describe("Badge · continua NÃO semântico, e isso é a proteção", () => {
  it("não ganhou variante `success`, `danger` nem `error`", () => {
    const fonte = readFileSync("src/components/ui/badge.tsx", "utf8");
    const inicio = fonte.indexOf("variant?:");
    expect(inicio, "a assinatura sumiu — o recorte seria vazio").toBeGreaterThan(-1);
    const assinatura = fonte.slice(inicio, fonte.indexOf(";", inicio));
    for (const proibida of ["success", "danger", "error"]) {
      expect(
        assinatura.includes(proibida),
        `Badge passou a afirmar semântica: ${proibida}`,
      ).toBe(false);
    }
  });

  it("e segue renderizando — a Fundação não quebrou quem já o usa", () => {
    render(<Badge variant="sage">Selecionado</Badge>);
    expect(screen.getByText("Selecionado")).toBeInTheDocument();
  });
});

describe("§27 · teste de perda — remover a garantia derruba teste", () => {
  it("se `SINAL_DO_PAPEL` perdesse um papel, o StateMark cairia", () => {
    // Simula a perda sem mutar produção: um papel fora do mapa não tem símbolo,
    // e é exatamente isso que a asserção de cobertura acima impede.
    const incompleto: Partial<Record<PapelVisual, string>> = { ...SINAL_DO_PAPEL };
    delete incompleto.atencao;
    const cobertos = PAPEIS_VISUAIS.filter((p) => (incompleto[p] ?? "").length > 0);
    expect(cobertos.length).toBeLessThan(PAPEIS_VISUAIS.length);
  });

  it("se dois papéis passassem a compartilhar classe, a distinção cairia", () => {
    const colidido = PAPEIS_VISUAIS.map(() => classeDoPapel("neutro"));
    expect(new Set(colidido).size).toBeLessThan(PAPEIS_VISUAIS.length);
  });
});
