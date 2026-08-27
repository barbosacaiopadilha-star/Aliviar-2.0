import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isProtectedPath, isPublicPath } from "@/modules/auth/public-paths";

/**
 * "O QUE É A ALIVIAR" — a porta de quem só está olhando.
 *
 * A Landing ia de quatro ambientes fotográficos direto para "Quero conversar
 * com a Aliviar". Quem queria entender antes de topar uma ligação não tinha
 * para onde ir: ou aceitava a conversa, ou ia embora.
 *
 * O que este arquivo protege, e cada caso tem um defeito real por trás:
 *
 *  1. A rota é PÚBLICA. É a lição do `FUN-01`, em que uma rota pública fora
 *     da lista recebia 302 para o login e o dado morria em silêncio.
 *  2. Ela é ALCANÇÁVEL pelo rodapé. Página sem caminho é página que não
 *     existe — foi o que aconteceu com `/privacidade` e `/termos`, no ar e
 *     órfãs até 27/08.
 *  3. Ela NÃO afirma privacidade sem lastro. A base está adiada por decisão
 *     registrada (ADR-096) e a política não está publicada; o `faq-compact`
 *     foi condenado pela auditoria por exatamente esta classe de frase.
 */

const RAIZ = process.cwd();

function ler(arquivo: string): string {
  return readFileSync(path.join(RAIZ, arquivo), "utf-8");
}

/**
 * O que o navegador RECEBE. Os comentários da página citam nominalmente as
 * frases proibidas para explicar por que são proibidas — e citar um resíduo
 * não é reintroduzi-lo. Mesmo recurso que a `sistema-visual-consolidado`
 * já usava pela mesma razão; sem ele, esta trava mordia a própria doutrina.
 */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("O que é a Aliviar — a porta de quem só olha", () => {
  it("é pública, e declarada como tal — não passa por omissão", () => {
    expect(isPublicPath("/o-que-e")).toBe(true);
    expect(isProtectedPath("/o-que-e")).toBe(false);
  });

  it("o rodapé leva até ela — página sem caminho não existe", () => {
    const rodape = ler("src/components/landing/public-footer.tsx");
    expect(rodape).toContain('href: "/o-que-e"');
  });

  it("o rodapé também leva a Privacidade e Termos, que estavam órfãos", () => {
    const rodape = ler("src/components/landing/public-footer.tsx");
    expect(rodape).toContain('href: "/privacidade"');
    expect(rodape).toContain('href: "/termos"');
  });

  it("não afirma consentimento nem política vigente enquanto não houver", () => {
    const pagina = semComentarios(ler("src/app/(public)/o-que-e/page.tsx"));

    // O `faq-compact.tsx` dizia "com consentimento" sem nada que o
    // sustentasse. Enquanto a ADR-096 mantiver a base adiada, nenhuma
    // superfície pública pode afirmar isso.
    expect(pagina).not.toMatch(/com consentimento/i);
    expect(pagina).not.toMatch(/política de privacidade vigente/i);

    // O que ela PODE dizer, porque é verdade hoje.
    expect(pagina).toMatch(/em prepara[çc][ãa]o/i);
  });

  it("não promete prazo, agendamento nem cobertura — ADR-064", () => {
    const pagina = semComentarios(ler("src/app/(public)/o-que-e/page.tsx"));

    expect(pagina).not.toMatch(/\bagendamos\b|\bmarcamos (a|sua) consulta\b/i);
    expect(pagina).not.toMatch(/em at[ée] \d+ (dias|horas)/i);
    expect(pagina).not.toMatch(/garantimos/i);
  });

  it("diz o preço inteiro: o valor, o que cobre, e o que fica de fora", () => {
    const pagina = semComentarios(ler("src/app/(public)/o-que-e/page.tsx"));

    expect(pagina).toContain("R$ 450");
    expect(pagina).toMatch(/à parte/);
    expect(pagina).toMatch(/não recebe nada dessa consulta/i);
  });
});
