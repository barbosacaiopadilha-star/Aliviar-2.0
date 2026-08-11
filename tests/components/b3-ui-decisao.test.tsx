import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CuradoriaDecisionPanel } from "@/components/patient/curadoria-decision-panel";

/**
 * B3-UI · O SILÊNCIO DEPOIS DA DECISÃO.
 *
 * O gate da B3 provou que a linha persiste: o defeito nunca foi perda de dado.
 * O caminho de sucesso executava `router.refresh()` **e mais nada** — e o
 * formulário voltava ao início como se o ato dela não tivesse acontecido.
 *
 * O que esta suíte fixa:
 *
 * - **feedback imediato**, com a copy congelada e mecanismo acessível;
 * - **o transitório não é a verdade** — o estado durável vem do FATO
 *   projetado, e sobrevive a refresh, reload e nova montagem;
 * - **decidida não reapresenta formulário**, nem oferece trocar/editar/desfazer;
 * - **erro preserva o contexto** e não finge sucesso;
 * - **dupla submissão impedida**.
 */

const refreshMock = vi.fn();
const registerDecisionActionMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));
vi.mock("@/modules/curadoria/actions", () => ({
  registerDecisionAction: (input: unknown) => registerDecisionActionMock(input),
}));

const OPCOES = [
  { id: "op-a", professionalName: "Dra. Helena Monteiro" },
  { id: "op-b", professionalName: "Dr. Rafael Nogueira" },
  { id: "op-c", professionalName: "Dra. Marina Azevedo" },
];

beforeEach(() => {
  refreshMock.mockReset();
  registerDecisionActionMock.mockReset();
  registerDecisionActionMock.mockResolvedValue({ success: true });
});

afterEach(cleanup);

function painel(decided: Parameters<typeof CuradoriaDecisionPanel>[0]["decided"] = null) {
  return render(
    <CuradoriaDecisionPanel curatedSelectionId="sel-1" options={OPCOES} decided={decided} />,
  );
}

const DECIDIDA = {
  outcome: "CHOSEN" as const,
  chosenName: "Dra. Helena Monteiro",
  decidedAt: "2026-08-11T12:00:00.000Z",
};

async function decidir() {
  await userEvent.click(screen.getByRole("radio", { name: "Dra. Helena Monteiro" }));
  await userEvent.click(screen.getByRole("button", { name: /Registrar minha decisão/ }));
}

describe("B3-UI · a decisão da paciente", () => {
  // -------------------------------------------------------------------------
  it("B3-UI-1 · sem decisão, o formulário está disponível", () => {
    painel();

    expect(screen.getByRole("button", { name: /Registrar minha decisão/ })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(OPCOES.length + 1); // + "nenhuma destas"
  });

  // -------------------------------------------------------------------------
  it("B3-UI-2 · o sucesso é dito, com a copy congelada", async () => {
    painel();
    await decidir();

    await waitFor(() => {
      expect(screen.getByText("Sua decisão foi registrada.")).toBeInTheDocument();
    });
    expect(screen.getByText("Agora a Aliviar pode seguir com os próximos passos.")).toBeInTheDocument();

    // E o formulário sai de cena: o ato aconteceu.
    expect(screen.queryByRole("button", { name: /Registrar minha decisão/ })).toBeNull();
  });

  it("B3-UI-9 · a confirmação é anunciável e recebe o foco", async () => {
    painel();
    await decidir();

    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    // Quem navega por teclado não fica com o foco num botão que sumiu.
    await waitFor(() => expect(status).toHaveFocus());
  });

  it("B3-UI-3 · o refresh continua sendo pedido — o transitório é ponte, não destino", async () => {
    painel();
    await decidir();

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  // -------------------------------------------------------------------------
  describe("B3-UI-4 / B3-UI-5 · o estado durável vem do FATO, não do React", () => {
    it("decisão projetada renderiza o estado decidido, sem passar por interação", () => {
      painel(DECIDIDA);

      expect(screen.getByText("Sua decisão está registrada.")).toBeInTheDocument();
      expect(
        screen.getByText(/a próxima etapa passa a ser acompanhada pela Equipe Aliviar/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Você continua podendo consultar sua Curadoria sempre que precisar."),
      ).toBeInTheDocument();
    });

    it("mostra QUAL decisão foi registrada", () => {
      painel(DECIDIDA);

      expect(screen.getByText(/Você escolheu Dra\. Helena Monteiro/)).toBeInTheDocument();
    });

    it("'nenhuma destas' não é tratada como falha dela", () => {
      painel({ outcome: "NONE_OF_THEM", chosenName: null, decidedAt: DECIDIDA.decidedAt });

      expect(screen.getByText(/não é uma falha sua/)).toBeInTheDocument();
    });

    it("B3-UI-5 · decidida não reapresenta formulário nem oferece desfazer", () => {
      const { container } = painel(DECIDIDA);

      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.queryByRole("button", { name: /Registrar minha decisão/ })).toBeNull();

      const texto = (container.textContent ?? "").toLowerCase();
      for (const proibido of ["editar", "desfazer", "apagar", "trocar", "escolher outro", "alterar"]) {
        expect(texto, `a UI ofereceu "${proibido}"`).not.toContain(proibido);
      }
    });

    it("o fallback é institucional — nenhum Concierge nominal é inventado", () => {
      const { container } = painel(DECIDIDA);

      expect(container.textContent).toContain("Equipe Aliviar");
      expect(container.textContent).not.toMatch(/Sua Concierge é|Seu Concierge é/);
    });

    it("oferece o canal REAL já configurado, sem inventar endereço", () => {
      painel(DECIDIDA);

      const link = screen.getByRole("link", { name: "Falar com a Aliviar" });
      // O número vem da fonte única aprovada (MISSÃO 205), nunca reescrito aqui.
      expect(link).toHaveAttribute("href", expect.stringContaining("wa.me/5511979037133"));
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });

  // -------------------------------------------------------------------------
  describe("B3-UI-7 · o erro não finge sucesso", () => {
    beforeEach(() => {
      registerDecisionActionMock.mockResolvedValue({
        success: false,
        error: "Não foi possível registrar sua decisão agora.",
      });
    });

    it("mostra mensagem humana e preserva a escolha dela", async () => {
      painel();
      await userEvent.click(screen.getByRole("radio", { name: "Dr. Rafael Nogueira" }));
      await userEvent.type(screen.getByLabelText(/o que pesou na sua escolha/i), "Fica mais perto.");
      await userEvent.click(screen.getByRole("button", { name: /Registrar minha decisão/ }));

      const alerta = await screen.findByRole("alert");
      expect(alerta).toHaveTextContent("Não foi possível registrar sua decisão agora.");

      // Contexto preservado: a escolha e a nota continuam onde ela deixou.
      expect(screen.getByRole("radio", { name: "Dr. Rafael Nogueira" })).toBeChecked();
      expect(screen.getByLabelText(/o que pesou na sua escolha/i)).toHaveValue("Fica mais perto.");

      // E nenhum falso sucesso.
      expect(screen.queryByText("Sua decisão foi registrada.")).toBeNull();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("não vaza SQL, RLS, constraint ou código interno", async () => {
      registerDecisionActionMock.mockResolvedValue({
        success: false,
        error: "Não foi possível registrar sua decisão agora.",
      });
      const { container } = painel();
      await decidir();
      await screen.findByRole("alert");

      const texto = container.textContent ?? "";
      for (const vazamento of ["23505", "RLS", "constraint", "duplicate key", "insert into"]) {
        expect(texto).not.toContain(vazamento);
      }
    });
  });

  // -------------------------------------------------------------------------
  it("B3-UI-8 · a submissão em andamento impede a segunda", async () => {
    let liberar: (v: { success: true }) => void = () => {};
    registerDecisionActionMock.mockReturnValue(
      new Promise<{ success: true }>((resolve) => {
        liberar = resolve;
      }),
    );

    painel();
    // A referência é capturada ANTES: durante o envio o rótulo do botão muda,
    // e depender dele tornaria o teste refém da copy de carregamento.
    const botao = screen.getByRole("button", { name: /Registrar minha decisão/ });
    await decidir();

    // Enquanto pende, o botão não aceita outro clique.
    expect(botao).toBeDisabled();
    await userEvent.click(botao);
    expect(registerDecisionActionMock).toHaveBeenCalledTimes(1);

    liberar({ success: true });
    await waitFor(() => expect(screen.getByText("Sua decisão foi registrada.")).toBeInTheDocument());
  });

  // -------------------------------------------------------------------------
  it("a decisão não é enviada sem escolha — o botão nasce inerte", () => {
    painel();

    expect(screen.getByRole("button", { name: /Registrar minha decisão/ })).toBeDisabled();
    expect(registerDecisionActionMock).not.toHaveBeenCalled();
  });
});
