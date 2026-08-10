import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A1 · O OVERFLOW HORIZONTAL DA HOME NO CELULAR.
 *
 * Medido antes: a 390px o documento tinha `scrollWidth = 472` contra
 * `clientWidth = 390`. A causa não era a largura da régua da Jornada — ela
 * sempre esteve contida e rolando por dentro (`clientWidth 358`,
 * `scrollWidth 560`).
 *
 * Era **bloco de contenção errado**. Cada marco carrega um `.sr-only`, que é
 * `position: absolute`. Com o `li` estático, o bloco de contenção deles
 * resolvia para o `<main>` — que é `relative` — e esses spans escapavam do
 * `overflow-x: auto` da trilha, pousando na coordenada do conteúdo ROLADO
 * (x≈471) e esticando a página até 472.
 *
 * A prova browser é superior a esta guarda e foi feita: a 390px o documento
 * ficou 390/390 enquanto a trilha seguiu 358/560. Mas ela exige app de pé,
 * sessão da paciente e cenário semeado — então esta guarda existe para o dia
 * a dia, protegendo exatamente a linha que fecha a causa.
 */

const CSS = readFileSync("src/app/patient-dashboard.css", "utf8");
const semComentarios = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

function regra(seletor: string): string {
  const i = semComentarios.indexOf(seletor);
  expect(i, `a regra ${seletor} sumiu — o recorte seria vazio`).toBeGreaterThan(-1);
  return semComentarios.slice(i, semComentarios.indexOf("}", i));
}

describe("A1 · a régua ancora os próprios `sr-only`", () => {
  it("o marco é bloco de contenção — sem isso os `sr-only` escapam do clip", () => {
    expect(regra(".patient-dashboard .patient-walk__step {")).toMatch(/position:\s*relative/);
  });

  it("e a trilha mantém o scroll interno que sempre teve", () => {
    const trilha = regra(".patient-dashboard .patient-walk__track {");
    expect(trilha).toMatch(/overflow-x:\s*auto/);
    expect(trilha).toMatch(/display:\s*flex/);
  });

  it("a régua não foi alterada visualmente — largura e flex intactos", () => {
    const marco = regra(".patient-dashboard .patient-walk__step {");
    expect(marco).toMatch(/min-width:\s*4\.5rem/);
    expect(marco).toMatch(/flex:\s*1 0 auto/);
    expect(marco).not.toMatch(/flex-wrap/);
  });

  it("§8 · a correção não é workaround global de overflow", () => {
    // Nenhum `overflow-x: hidden` no contêiner da casa ou acima dele.
    const casa = regra(".patient-dashboard {");
    expect(casa).not.toMatch(/overflow-x:\s*hidden/);
    expect(semComentarios).not.toMatch(/(html|body)\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
