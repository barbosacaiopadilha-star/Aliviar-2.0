import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";

/**
 * RODADA 5 · O QUE É COMUM DEIXA DE FINGIR QUE É CARACTERÍSTICA INDIVIDUAL.
 *
 * Duas frases não variavam de candidato para candidato — a proveniência de
 * quem entra na Rede, e como ler as contagens do Motor — e mesmo assim eram
 * reimpressas dentro de cada cartão. Com N candidatos, `2N` ocorrências de
 * informação constante; para o leitor de tela, `2N` anúncios sem ganho.
 *
 * Agora cada uma aparece **uma vez**, no nível do conjunto, associada à
 * seção pelo `aria-describedby` que a estrutura já permitia. Os cartões
 * continuam cartões: contêiner, borda, seleção, badge e ordem intactos.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/modules/curadoria/actions", () => ({
  saveReportAction: vi.fn(),
  saveSelectionAction: vi.fn(),
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

afterEach(cleanup);

const CONST_1 = "Aprovado pela Aliviar — critério próprio, anterior a este caso.";
const CONST_2 =
  "Contagens por estado — nunca uma nota. O detalhe, critério a critério, está na Comparação.";

function candidato(n: number) {
  return {
    professionalProfileId: `00000000-0000-0000-0000-00000000000${n}`,
    nome: `Profissional ${n}`,
    // O resumo É específico: contagens desta pessoa neste caso.
    resumo: `${n} altas · ${n + 1} médias · 2 lacunas`,
    celulas: [],
  };
}

function montar(quantos: number) {
  const candidatos = Array.from({ length: quantos }, (_, i) => candidato(i + 1));
  render(
    <MesaWorkspace
      candidatos={candidatos}
      excluidos={[]}
      curatorName="Dr. Curador"
      patientFirstName="Maria"
      priorityProfileId="00000000-0000-0000-0000-0000000000b1"
      persisted={{ selectedIds: [], pareceres: [], compositionRationale: "", closed: false }}
      reportHref="/relatorio"
    />,
  );
  return candidatos;
}

/** A seção dos elegíveis — o conjunto do qual as frases falam. */
function secao() {
  return document.querySelector('section[aria-labelledby="elegiveis-heading"]')!;
}

/** Os cartões de candidato, na ordem do documento. */
function cartoes(): HTMLElement[] {
  const grid = secao().querySelector(".grid")!;
  return [...grid.children] as HTMLElement[];
}

function ocorrencias(texto: string, frase: string) {
  return texto.split(frase).length - 1;
}

describe("R-5 · as constantes sobem para o conjunto", () => {
  it("T-R5-1 · com N candidatos, a constante 1 renderiza exatamente UMA vez", () => {
    montar(4);
    expect(cartoes()).toHaveLength(4); // o alvo existe, e é plural
    expect(ocorrencias(document.body.textContent ?? "", CONST_1)).toBe(1);
  });

  it("T-R5-2 · com N candidatos, a constante 2 renderiza exatamente UMA vez", () => {
    montar(4);
    expect(cartoes()).toHaveLength(4);
    expect(ocorrencias(document.body.textContent ?? "", CONST_2)).toBe(1);
  });

  it("T-R5-2b · e não sobrou nenhuma delas DENTRO de cartão nenhum", () => {
    montar(4);
    for (const cartao of cartoes()) {
      const texto = cartao.textContent ?? "";
      expect(texto).not.toContain(CONST_1);
      expect(texto).not.toContain(CONST_2);
    }
  });

  it("T-R5-3 · todos os N candidatos continuam renderizados — N → N", () => {
    const candidatos = montar(4);
    expect(cartoes()).toHaveLength(candidatos.length);
    for (const c of candidatos) {
      expect(screen.getByRole("heading", { name: c.nome })).toBeInTheDocument();
    }
  });

  it("T-R5-4 · a informação específica de cada candidato permanece", () => {
    const candidatos = montar(4);
    for (const [i, cartao] of cartoes().entries()) {
      const texto = cartao.textContent ?? "";
      expect(texto).toContain(candidatos[i]!.nome);
      // A leitura do Motor daquele candidato — o que de fato o distingue.
      expect(texto).toContain(candidatos[i]!.resumo);
      expect(texto).toContain("Leitura do Motor para este caso");
      // E os dois atos possíveis continuam no cartão.
      expect(within(cartao).getByRole("button", { name: "Comparar" })).toBeInTheDocument();
      expect(within(cartao).getByRole("button", { name: "Selecionar" })).toBeInTheDocument();
    }
  });

  it("T-R5-5 · selecionar e desselecionar continua funcionando", async () => {
    const user = userEvent.setup();
    montar(4);
    const primeiro = cartoes()[0]!;
    await user.click(within(primeiro).getByRole("button", { name: "Selecionar" }));
    expect(within(cartoes()[0]!).getByRole("button", { name: "Remover da seleção" })).toBeInTheDocument();
    await user.click(within(cartoes()[0]!).getByRole("button", { name: "Remover da seleção" }));
    expect(within(cartoes()[0]!).getByRole("button", { name: "Selecionar" })).toBeInTheDocument();
  });

  it("T-R5-6 · o estado visual de selecionado continua — badge e borda", async () => {
    const user = userEvent.setup();
    montar(4);
    expect(screen.queryByText("Selecionado")).toBeNull();
    const classesAntes = cartoes()[0]!.className;

    await user.click(within(cartoes()[0]!).getByRole("button", { name: "Selecionar" }));

    const cartao = cartoes()[0]!;
    expect(within(cartao).getByText("Selecionado")).toBeInTheDocument();
    expect(cartao.className).not.toBe(classesAntes); // a borda mudou
    // E só o selecionado ganhou marca.
    expect(screen.getAllByText("Selecionado")).toHaveLength(1);
  });

  it("T-R5-7 · o limite de três seleções permanece intacto", async () => {
    const user = userEvent.setup();
    montar(4);
    for (let i = 0; i < 3; i++) {
      await user.click(within(cartoes()[i]!).getByRole("button", { name: "Selecionar" }));
    }
    expect(screen.getAllByText("Selecionado")).toHaveLength(3);
    // O quarto não pode entrar, e o motivo é dito — nunca botão cinza mudo.
    const quarto = cartoes()[3]!;
    expect(within(quarto).getByRole("button", { name: "Selecionar" })).toBeDisabled();
    expect(within(quarto).getByText("As três já estão selecionadas — remova uma para trocar.")).toBeInTheDocument();
  });

  it("T-R5-8 · as duas mensagens comuns continuam VISÍVEIS, e associadas ao conjunto", () => {
    montar(4);
    const comum = document.getElementById("elegiveis-comum");
    expect(comum, "o bloco comum sumiu").toBeTruthy();
    expect(comum!.textContent).toContain(CONST_1);
    expect(comum!.textContent).toContain(CONST_2);

    // §14 — reaproveita a estrutura que já existia, sem ARIA inventada.
    expect(secao().getAttribute("aria-describedby")).toBe("elegiveis-comum");
    expect(secao().getAttribute("aria-labelledby")).toBe("elegiveis-heading");

    // §7 — o bloco comum NÃO virou mais um cartão.
    expect(comum!.closest("[class*='rounded-lg']")).toBeNull();

    // §9 — continuam duas afirmações distintas, não uma frase fundida.
    expect(comum!.querySelectorAll("p")).toHaveLength(2);
  });

  it("T-R5-9 · a ordem dos candidatos permanece a da Rede", () => {
    const candidatos = montar(4);
    const nomes = cartoes().map((c) => c.querySelector("h3")?.textContent);
    expect(nomes).toEqual(candidatos.map((c) => c.nome));
  });

  it("T-R5-10 · o alvo de interação não encolheu — `min-h-10` em cada ato", () => {
    montar(4);
    for (const cartao of cartoes()) {
      for (const nome of ["Comparar", "Selecionar"]) {
        expect(within(cartao).getByRole("button", { name: nome }).className).toContain("min-h-10");
      }
    }
  });

  it("§21 · com UM candidato a centralização segue correta — um caminho só de layout", () => {
    montar(1);
    expect(cartoes()).toHaveLength(1);
    expect(ocorrencias(document.body.textContent ?? "", CONST_1)).toBe(1);
    expect(ocorrencias(document.body.textContent ?? "", CONST_2)).toBe(1);
    expect(document.getElementById("elegiveis-comum")).toBeTruthy();
  });

  it("§22 · com muitos candidatos o ganho cresce e o bloco continua um só", () => {
    montar(8);
    expect(cartoes()).toHaveLength(8);
    expect(ocorrencias(document.body.textContent ?? "", CONST_1)).toBe(1);
    expect(ocorrencias(document.body.textContent ?? "", CONST_2)).toBe(1);
    // 2N → 2: com 8 candidatos, 16 ocorrências viraram 2.
    expect(document.querySelectorAll("#elegiveis-comum")).toHaveLength(1);
  });

  it("§23 · nenhum outro cartão da workspace foi tocado", () => {
    montar(4);
    // O encerramento e a comparação continuam onde estavam, com seu texto.
    expect(screen.getByText("Encerrar a Curadoria Técnica")).toBeInTheDocument();
    expect(screen.getByText("Comparação")).toBeInTheDocument();
    // E o bloco comum não invadiu a área de encerramento.
    const comum = document.getElementById("elegiveis-comum")!;
    expect(secao().contains(comum)).toBe(true);
  });
});
