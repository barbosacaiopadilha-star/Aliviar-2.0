import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PatientShell } from "@/components/paciente/patient-shell";
import { PATIENT_NAV_ITEMS } from "@/components/paciente/patient-nav-items";

/**
 * A2C · A NAVEGAÇÃO PRIVADA NÃO PODE VOLTAR A MENTIR.
 *
 * Dois defeitos reais, ambos já corrigidos, ambos sem guarda até aqui:
 *
 * 1. **Subpasso não acendia.** A comparação era `pathname === href`. "Minha
 *    história" aponta para `/sua-historia/continuar`, e o wizard tem seis
 *    passos próprios — em nenhum deles o item ficava ativo. A paciente estava
 *    dentro da História com a navegação dizendo que não.
 *
 * 2. **Prefixo ingênuo acendia tudo.** A primeira correção usou o prefixo
 *    `/paciente`, e aí *todos* os itens da casa ficavam ativos ao mesmo tempo.
 *    Foi pego antes de entrar, e é o que o teste de "exatamente um" protege.
 *
 * A asserção é por `aria-current`, não por classe CSS nem por texto: é o que a
 * tecnologia assistiva lê, e é estável a repaginação.
 */

vi.mock("next/navigation", () => ({
  usePathname: () => (globalThis as Record<string, unknown>).__rota as string,
}));

afterEach(cleanup);

function montarEm(rota: string) {
  (globalThis as Record<string, unknown>).__rota = rota;
  render(<PatientShell>conteúdo</PatientShell>);
}

/** Os itens marcados como página atual, pelo href — nunca pela copy. */
function ativos(): string[] {
  return [...document.querySelectorAll('a[aria-current="page"]')].map(
    (a) => a.getAttribute("href") ?? "",
  );
}

const INICIO = "/paciente";
const HISTORIA = "/sua-historia/continuar";
const PASSOS = [
  "/sua-historia/continuar",
  "/sua-historia/para-quem",
  "/sua-historia/motivo",
  "/sua-historia/informacoes",
  "/sua-historia/historia",
  "/sua-historia/preferencias",
  "/sua-historia/revisao",
];

describe("A2C · cada rota acende o item certo", () => {
  const casos: Array<[string, string]> = [
    [INICIO, INICIO],
    // A Jornada saiu do MENU em 23/08 (a régua vive na Home) — a rota
    // continua de pé, mas não há item para acender.
    ["/paciente/perfil", "/paciente/perfil"],
    [HISTORIA, HISTORIA],
  ];

  for (const [rota, esperado] of casos) {
    it(`${rota} ⇒ ${esperado}`, () => {
      montarEm(rota);
      // Desktop e drawer renderizam a mesma lista: o esperado é que TODOS os
      // marcados apontem para o mesmo item.
      const marcados = [...new Set(ativos())];
      expect(marcados, `rota ${rota}`).toEqual([esperado]);
    });
  }
});

describe("A2C · defeito 1 — os subpassos da História acendem 'Minha história'", () => {
  for (const passo of PASSOS) {
    it(`${passo} mantém o item da História ativo`, () => {
      montarEm(passo);
      expect([...new Set(ativos())], `subpasso ${passo}`).toEqual([HISTORIA]);
    });
  }
});

describe("A2C · defeito 2 — exatamente UM item ativo, em toda rota privada", () => {
  const TODAS = [...PATIENT_NAV_ITEMS.map((i) => i.href), ...PASSOS];

  for (const rota of [...new Set(TODAS)]) {
    it(`${rota} não acende mais de um item`, () => {
      montarEm(rota);
      // A lista aparece duas vezes (desktop + drawer), então contamos itens
      // DISTINTOS: mais de um href marcado é o bug do prefixo ingênuo.
      expect([...new Set(ativos())].length, `rota ${rota}`).toBe(1);
    });
  }

  it("e `/paciente` não contamina as rotas irmãs — o Início é exato", () => {
    montarEm("/paciente/documentos");
    expect([...new Set(ativos())]).not.toContain(INICIO);
  });

  /**
   * CORTE FUNDO DE 23/08 · "Documentos" saiu do menu (quatro itens, um por
   * ato da casa) e é encontrado em "Meus dados". A rota continua inteira —
   * é direito dela ver o que enviou e recebeu —, e o que se prova aqui é que
   * ficar sem item no menu não acende o item errado: nem o Início por prefixo,
   * nem "Meus dados" por vizinhança.
   */
  it("uma rota fora do menu não acende item nenhum", () => {
    montarEm("/paciente/documentos");
    expect([...new Set(ativos())]).toEqual([]);
  });
});

describe("A2C · acessibilidade preservada", () => {
  it("o item ativo se declara por `aria-current=\"page\"`", () => {
    montarEm(INICIO);
    expect(document.querySelectorAll('a[aria-current="page"]').length).toBeGreaterThan(0);
  });

  it("o controle do menu mobile mantém `aria-expanded`", () => {
    montarEm(INICIO);
    const botao = screen.getByRole("button", { name: "Abrir menu" });
    expect(botao.getAttribute("aria-expanded")).toBe("false");
  });

  it("os landmarks da moldura seguem de pé", () => {
    montarEm(INICIO);
    expect(document.querySelector("header")).toBeTruthy();
    expect(document.querySelector("#patient-main")).toBeTruthy();
    expect(screen.getAllByLabelText("Navegação principal").length).toBeGreaterThan(0);
  });
});

describe("A2C · a História continua vestindo a moldura privada", () => {
  const LAYOUT = "src/app/(public)/sua-historia/(wizard)/layout.tsx";
  const fonte = readFileSync(LAYOUT, "utf8");
  const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("o layout do wizard compõe o `PatientShell`", () => {
    expect(codigo).toContain("PatientShell");
    expect(codigo).toMatch(/<PatientShell/);
  });

  it("e a guarda de sessão que ele sempre teve permanece", () => {
    // O route group `(public)` é organização de arquivo, não de acesso. Quem
    // protege é esta linha — e ela é anterior à A2B.
    expect(codigo).toContain('requireRole("paciente")');
  });

  it("a raiz pública explicativa continua existindo e separada", () => {
    const bruto = readFileSync("src/modules/auth/public-paths.ts", "utf8");
    expect(bruto.length).toBeGreaterThan(0);
    // Sem comentários: o arquivo CITA os passos do wizard justamente para
    // explicar que eles não são públicos — e explicação não é declaração.
    const declarado = bruto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(declarado).toContain('"/sua-historia"');
    for (const passo of ["para-quem", "motivo", "revisao", "continuar"]) {
      expect(declarado, `${passo} virou público`).not.toContain(`/sua-historia/${passo}`);
    }
  });
});
