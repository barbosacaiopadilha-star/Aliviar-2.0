import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * ONDE A LEITURA COMEÇA — A DOBRA DA CENA.
 *
 * Duas calibragens do Fundador no mesmo dia (24/08). A primeira, na aba
 * local: "os cards podem começar dessa linha pra baixo". A segunda, olhando
 * o produto no telefone dele: *"ainda está tampando, tem que aparecer pelo
 * menos as agendas no colo dela"*.
 *
 * A lição da segunda é a que estes oráculos guardam: **fração fixa de tela
 * não é régua.** `50svh` acertava no aparelho em que foi medida e tampava a
 * cena em outro, porque o que precisa aparecer não é "metade da tela" — é um
 * PONTO DA FOTOGRAFIA: a agenda no colo, a pasta da Aliviar, que é o motivo
 * de a cena existir.
 *
 * A régua passou a ser geométrica. A cena é `object-fit: cover` numa camada
 * fixa: sua altura desenhada é `max(altura da tela, largura / 0,5628)` e ela
 * fica centrada — logo o ponto da agenda (77,5% da altura do retrato) está em
 * `50svh + 0,275 × essa altura`. Medido com essa conta, o card pousa 25px
 * abaixo da agenda em 390×664 (Safari com as barras), 375×812, 430×932 e
 * 767×1024 — quatro formatos bem diferentes, a mesma folga.
 */

const CSS = readFileSync("src/app/patient-dashboard.css", "utf8");
const SHELL = readFileSync("src/components/paciente/patient-shell.tsx", "utf8");
const CENA = readFileSync("src/components/paciente/dashboard/patient-ambient-layer.tsx", "utf8");

describe("A dobra da cena no celular é geométrica, não uma fração chutada", () => {
  const bloco = (() => {
    const i = CSS.indexOf("@media (max-width: 767px)");
    return i === -1 ? "" : CSS.slice(i, CSS.indexOf("\n}", CSS.indexOf("padding-top", i)));
  })();

  it("existe, e mora na folha da casa — é lá que a geometria da cena vive", () => {
    expect(bloco).not.toBe("");
    expect(bloco).toContain("#patient-main");
    expect(bloco).toContain("padding-top");
  });

  it("a conta ancora na agenda: 0.275 da altura desenhada da cena", () => {
    // 0,275 = 0,775 (onde a agenda termina) − 0,5 (a cena é centrada).
    expect(bloco).toContain("0.275");
    // 177.68vw = largura ÷ 0,5628, a proporção do retrato 941×1672.
    expect(bloco).toContain("177.68vw");
    // `svh`: a viewport com a barra do navegador ABERTA, a menor que existe —
    // quando ela some, sobra mais cena, nunca menos.
    expect(bloco).toContain("svh");
    // Piso para o celular deitado, onde a conta encolheria demais.
    expect(bloco).toContain("18rem");
  });

  it("uma fração fixa de tela não volta a ser a régua", () => {
    // O que a 2ª calibragem derrubou: `50svh` no utilitário do shell.
    expect(SHELL).not.toContain("50svh");
    expect(SHELL).not.toContain("72svh");
  });
});

describe("O recuo troca no MESMO ponto em que a fotografia troca", () => {
  it("o shell muda de recuo em `md`, e a cena muda de arquivo em 768px", () => {
    // Antes o recuo entrava em `lg` (1024px) e o <picture> em 768px: entre um
    // e outro, o tablet ficava com a foto DEITADA e o recuo do celular — o
    // conteúdo despencava para o pé da tela sem motivo.
    expect(SHELL).toContain("md:pt-[clamp(");
    expect(SHELL).not.toContain("lg:pt-[clamp(");
    expect(CENA).toContain('media="(min-width: 768px)"');
  });

  it("e a regra do celular para exatamente onde a do computador começa", () => {
    expect(CSS).toContain("@media (max-width: 767px)");
  });
});
