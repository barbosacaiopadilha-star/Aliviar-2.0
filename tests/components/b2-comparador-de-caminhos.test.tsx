import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CaminhosPanel } from "@/components/paciente/caminhos/caminhos-panel";
import { ComparacaoCaminhos } from "@/components/paciente/caminhos/comparacao-caminhos";
import type { PatientCuradoria, PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

/**
 * B2 · O CONTRATO DA COMPARAÇÃO.
 *
 * A auditoria concluiu **preservar**: `ComparacaoCaminhos` já compara por
 * DIMENSÃO, uma de cada vez, com os caminhos empilhados dentro dela — que é
 * exatamente a forma que o contrato pede para o mobile, e que no desktop
 * dispensa a matriz sem perder equivalência. Não há tabela para comprimir,
 * porque não há tabela.
 *
 * O que já estava guardado em `paciente-caminhos.test.tsx` (22 guardas) **não
 * é duplicado aqui**: uma dimensão por vez, troca de dimensão, menos de dois
 * não compara, nasce vazia, zero número/nota/ranking.
 *
 * Esta suíte fecha o que aquelas não alcançavam:
 *
 * - **comparar não decide** — nenhum caminho para gravar escolha;
 * - **o mobile não depende de tabela** — provado pela ESTRUTURA, não por
 *   screenshot: se alguém trocar os blocos por `<table>`, cai aqui;
 * - **cada valor pertence a um caminho nomeado** — sem isso a comparação vira
 *   uma coluna de estados sem dono;
 * - **explorar ≠ comparar** — as duas intenções têm ações distintas.
 */

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const NIVEIS = ["PLENO", "PARCIAL", "A_CONFIRMAR", "NAO_ATENDE"] as const;

function dimensoes(overrides: Record<string, (typeof NIVEIS)[number]> = {}) {
  const base: Record<string, (typeof NIVEIS)[number]> = {
    FORMACAO: "PLENO",
    EXPERIENCIA: "PLENO",
    CONTINUIDADE_DO_CUIDADO: "PLENO",
    MODELO_DE_ATENDIMENTO: "PLENO",
    ACESSO: "PLENO",
    ...overrides,
  };
  const rotulos: Record<string, string> = {
    FORMACAO: "Formação",
    EXPERIENCIA: "Experiência",
    CONTINUIDADE_DO_CUIDADO: "Continuidade",
    MODELO_DE_ATENDIMENTO: "Modelo de atendimento",
    ACESSO: "Acesso",
  };
  return Object.entries(base).map(([criterion, level]) => ({
    criterion,
    label: rotulos[criterion]!,
    level,
  })) as PatientCuradoriaOption["dimensions"];
}

function opcao(id: string, nome: string, over: Partial<PatientCuradoriaOption> = {}): PatientCuradoriaOption {
  return {
    id,
    professionalProfileId: `prof-${id}`,
    professionalName: nome,
    justification: `Este caminho entrou porque responde ao seu caso — ${nome}.`,
    relationToWeights: "Em relação ao seu Perfil: Continuidade do Cuidado atende plenamente.",
    relationalReading: null,
    favorablePoints: ["Formação específica para o seu caso."],
    attentionPoints: ["Ainda não conseguimos confirmar como ocorre o acompanhamento."],
    suggestedQuestions: ["Como funciona o acompanhamento após a primeira consulta?"],
    dimensions: dimensoes(),
    formacao: [],
    ...over,
  };
}

const A = opcao("a", "Dra. Helena Monteiro");
const B = opcao("b", "Dr. Rafael Nogueira", {
  dimensions: dimensoes({ ACESSO: "PARCIAL", MODELO_DE_ATENDIMENTO: "A_CONFIRMAR" }),
});

const CURADORIA: PatientCuradoria = {
  curatedSelectionId: "sel-1",
  caseId: "case-1",
  curatorName: null,
  deliveredAt: "2026-07-27T12:00:00.000Z",
  compositionRationale: "Os três cobrem a área exigida por caminhos diferentes.",
  options: [A, B, opcao("c", "Dra. Marina Azevedo")],
  decision: null,
};

describe("B2 · o comparador de caminhos", () => {
  // -------------------------------------------------------------------------
  describe("T-B2-1 / T-B2-2 · a comparação é ato dela", () => {
    it("T-B2-1 · nasce vazia, e o convite não trata o vazio como pendência", () => {
      render(<CaminhosPanel curadoria={CURADORIA} />);

      // Nenhuma dimensão está sendo comparada antes de ela marcar algo.
      expect(screen.queryByRole("tablist", { name: "Aspectos" })).toBeNull();
      expect(screen.getByText(/Comparar é opcional/)).toBeInTheDocument();

      const texto = document.body.textContent ?? "";
      for (const proibido of ["0 selecionados", "Selecione itens", "Comparação vazia"]) {
        expect(texto).not.toContain(proibido);
      }
    });

    it("T-B2-2 · um caminho não fabrica comparação", () => {
      render(<ComparacaoCaminhos options={[A]} />);

      expect(screen.queryByRole("tablist")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("T-B2-3 · dois caminhos escolhidos mostram a diferença", () => {
    it("cada valor pertence a um caminho NOMEADO — não é coluna de estados sem dono", async () => {
      render(<ComparacaoCaminhos options={[A, B]} />);

      // Na dimensão "Acesso", A atende plenamente e B parcialmente: a
      // diferença precisa ser lida por caminho, não em bloco.
      await userEvent.click(screen.getByRole("tab", { name: "Acesso" }));
      const painel = screen.getByRole("tabpanel");

      for (const nome of [A.professionalName, B.professionalName]) {
        expect(within(painel).getByText(nome)).toBeInTheDocument();
      }

      // O estado de cada um chega ao leitor de tela junto do rótulo da
      // dimensão — a textura sozinha não carrega informação.
      expect(within(painel).getAllByText(/Acesso:/).length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("T-B2-6 · comparar não decide", () => {
    it("nenhuma ação de escolha existe na comparação", async () => {
      render(<ComparacaoCaminhos options={[A, B]} />);
      const painel = screen.getByRole("tabpanel");

      // Os únicos controles da comparação são os seletores de dimensão.
      expect(within(painel).queryAllByRole("button")).toHaveLength(0);
      expect(within(painel).queryAllByRole("link")).toHaveLength(0);
    });

    it("nem no ambiente inteiro, depois de conhecer os três", async () => {
      render(<CaminhosPanel curadoria={CURADORIA} />);

      for (const nome of ["Dra. Helena Monteiro", "Dr. Rafael Nogueira", "Dra. Marina Azevedo"]) {
        const carta = screen.getByRole("article", { name: nome });
        await userEvent.click(within(carta).getByRole("button", { name: "Conhecer este caminho" }));
      }

      const texto = (document.body.textContent ?? "").toLowerCase();
      for (const proibido of ["escolher este", "confirmar opção", "minha escolha", "selecionar este caminho"]) {
        expect(texto).not.toContain(proibido);
      }
    });
  });

  // -------------------------------------------------------------------------
  /**
   * T-B2-8 · o mobile não depende de tabela — provado pela ESTRUTURA.
   *
   * Um screenshot mostra que hoje está bom; ele não impede que amanhã alguém
   * troque os blocos por `<table>` e a leitura vire rolagem lateral. A régua
   * aqui é o DOM: se a comparação passar a ser tabela ou grade horizontal,
   * este teste cai antes de qualquer captura.
   */
  describe("T-B2-8 · a comparação não é tabela", () => {
    it("nenhum elemento de tabela na comparação", () => {
      const { container } = render(<ComparacaoCaminhos options={[A, B]} />);

      for (const tag of ["table", "thead", "tbody", "tr", "td", "th"]) {
        expect(container.querySelectorAll(tag), `<${tag}> na comparação`).toHaveLength(0);
      }
      for (const papel of ["table", "row", "cell", "columnheader"]) {
        expect(screen.queryAllByRole(papel), `role="${papel}" na comparação`).toHaveLength(0);
      }
    });

    it("os caminhos empilham — nenhuma coluna horizontal os coloca lado a lado", () => {
      const { container } = render(<ComparacaoCaminhos options={[A, B]} />);
      const painel = container.querySelector("#comparacao-painel")!;

      // `space-y-*` empilha; `grid-cols`/`flex-row` seriam colunas, e coluna
      // em 390px é o que produz texto espremido e cabeçalho truncado.
      expect(painel.className).toMatch(/space-y-/);
      expect(painel.className).not.toMatch(/grid-cols-|flex-row|overflow-x/);
    });
  });

  // -------------------------------------------------------------------------
  describe("§8 · explorar e comparar são intenções distintas", () => {
    it("cada carta oferece as duas ações, com verbos diferentes", () => {
      render(<CaminhosPanel curadoria={CURADORIA} />);
      const carta = screen.getByRole("article", { name: A.professionalName });

      // Conhecer é BOTÃO — um ato que abre a carta ali mesmo.
      expect(within(carta).getByRole("button", { name: "Conhecer este caminho" })).toBeInTheDocument();

      // Comparar é CHECKBOX — seleção reversível, não um ato. A diferença de
      // controle é o que mantém as duas intenções separadas: marcar não abre
      // nada, e abrir não marca nada.
      const marcar = within(carta).getByRole("checkbox", { name: /comparar/i });
      expect(marcar).not.toBeChecked();
    });
  });
});
