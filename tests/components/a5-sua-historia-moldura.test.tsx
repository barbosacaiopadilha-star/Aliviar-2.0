import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";


import { PublicHeaderGate } from "@/components/landing/public-header-gate";

/**
 * A5 · "SUA HISTÓRIA" TEM UMA MOLDURA SÓ.
 *
 * O defeito, encontrado na captura: desde que o wizard passou a vestir o
 * `PatientShell` (A2B), a página vinha com **dois cabeçalhos empilhados** — o
 * público (logotipo + "Minha Jornada") sobre o privado (logotipo + navegação
 * da casa + menu da conta). Duas marcas Aliviar e duas navegações, uma delas
 * levando para fora da conversa, na tela em que a pessoa conta o que vive.
 *
 * O rodapé já tinha sido resolvido assim numa rodada anterior. O topo não —
 * e a assimetria não tinha guarda nenhuma.
 */

vi.mock("next/navigation", () => ({
  usePathname: () => (globalThis as Record<string, unknown>).__rota as string,
}));

afterEach(cleanup);

function em(rota: string, no: React.ReactNode) {
  (globalThis as Record<string, unknown>).__rota = rota;
  return render(<>{no}</>);
}

const PASSOS = [
  "/sua-historia",
  "/sua-historia/continuar",
  "/sua-historia/para-quem",
  "/sua-historia/motivo",
  "/sua-historia/historia",
  "/sua-historia/informacoes",
  "/sua-historia/preferencias",
  "/sua-historia/revisao",
];

describe("A5 · o topo da Fachada não entra na conversa", () => {
  for (const rota of PASSOS) {
    it(`${rota} não renderiza o cabeçalho público`, () => {
      em(rota, <PublicHeaderGate><span>topo público</span></PublicHeaderGate>);
      expect(screen.queryByText("topo público")).not.toBeInTheDocument();
    });
  }

  it("mas a Landing continua com o cabeçalho dela", () => {
    em("/", <PublicHeaderGate><span>topo público</span></PublicHeaderGate>);
    expect(screen.getByText("topo público")).toBeVisible();
  });

  it("e outras rotas públicas também", () => {
    for (const rota of ["/consentimentos", "/login"]) {
      cleanup();
      em(rota, <PublicHeaderGate><span>topo público</span></PublicHeaderGate>);
      expect(screen.getByText("topo público"), rota).toBeVisible();
    }
  });
});

describe("A5 · topo e rodapé seguem a MESMA regra", () => {
  it("os dois gates decidem pela MESMA condição de rota", () => {
    // A assimetria era o defeito: o rodapé saía de "Sua História", o topo
    // ficava. A comparação é da REGRA, não do render — montar o rodapé real
    // aqui traria metade da Landing junto e tornaria a guarda frágil por
    // motivos que não têm nada a ver com o que ela protege.
    const condicao = (caminho: string) => {
      const fonte = readFileSync(caminho, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      const achada = fonte.match(/pathname\.startsWith\((["'`])(.+?)\1\)/);
      expect(achada, `${caminho} deixou de decidir por rota`).toBeTruthy();
      return achada?.[2];
    };

    expect(condicao("src/components/landing/public-header-gate.tsx")).toBe("/sua-historia");
    expect(condicao("src/components/landing/public-footer-gate.tsx")).toBe("/sua-historia");
  });

  it("o gate do topo é usado pelo layout público — não fica só declarado", () => {
    const layout = readFileSync("src/app/(public)/layout.tsx", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
      .replace(/\/\/.*$/gm, "");
    expect(layout).toContain("PublicHeaderGate");
    expect(layout).toMatch(/<PublicHeaderGate>[\s\S]*PublicHeaderContainer[\s\S]*<\/PublicHeaderGate>/);
  });
});

describe("A5 · o campo narrativo é papel, não caixa de sistema", () => {
  const layout = readFileSync("src/components/story/story-step-layout.tsx", "utf8");

  it("as três perguntas abertas usam o mesmo tratamento", () => {
    // CORTE DE 23/08 · o motivo mudou de casa (fundido em para-quem), mas a
    // regra é a mesma: toda pergunta aberta escreve no campo narrativo.
    for (const passo of ["para-quem", "historia", "informacoes"]) {
      const fonte = readFileSync(`src/app/(public)/sua-historia/(wizard)/${passo}/page.tsx`, "utf8");
      expect(fonte, `${passo} não usa o campo narrativo`).toContain("CAMPO_NARRATIVO");
    }
  });

  it("e o tratamento é papel quente, sem material proibido", () => {
    expect(layout).toContain("CAMPO_NARRATIVO");
    expect(layout).toContain("--color-bg-canvas-warm");
    // PAPEL, NÃO VIDRO — a guarda de materiais vale aqui como em toda a casa.
    for (const proibido of ["backdrop-blur", "backdrop-filter", "glass"]) {
      expect(layout, `material proibido no campo: ${proibido}`).not.toContain(proibido);
    }
  });
});
