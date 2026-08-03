import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

import { ProtocoloPraticaForm } from "@/components/profissional/protocolo-pratica-form";

vi.mock("@/modules/curadoria/protocolos-actions", () => ({
  saveOwnProtocolDraftAction: vi.fn(async () => ({ success: true })),
  submitOwnProtocolAction: vi.fn(async () => ({ success: true, registered: 1 })),
}));

/**
 * PROTOCOLO DA PRÁTICA — o contrato da tela.
 *
 * O que se pina: progresso é contagem e nunca percentual; a condição aparece
 * quando a opção marcada a exige; a navegação cobre os cinco blocos; a
 * revisão diz "autodeclaração" e "ainda não verificadas" com todas as letras;
 * e nenhum texto promete posição, nota ou verificação.
 */

function renderForm(initial: Record<string, never> = {}) {
  return render(<ProtocoloPraticaForm initialResponses={initial} lastSavedAt={null} />);
}

describe("ProtocoloPraticaForm", () => {
  it("mostra progresso como contagem — nunca percentual", () => {
    renderForm();
    expect(screen.getByText("0 de 29 perguntas respondidas")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/%|por cento|completo|qualidade/i);
  });

  it("navega pelos cinco blocos oficiais", () => {
    renderForm();
    for (const bloco of [
      "Acesso ao cuidado",
      "Continuidade do cuidado",
      "Modelo de atendimento",
      "Prática e trajetória",
      "Viabilidade de acesso",
    ]) {
      expect(screen.getByRole("button", { name: bloco })).toBeInTheDocument();
    }
  });

  it("marcar opção condicionada faz o campo de condição aparecer", () => {
    renderForm();
    expect(screen.queryByLabelText(/Condição — Modalidade/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Primeira remota, sob condição"));

    expect(screen.getByLabelText(/Condição — Modalidade/)).toBeInTheDocument();
    expect(screen.getByText("1 de 29 perguntas respondidas")).toBeInTheDocument();
  });

  it("a revisão fala em autodeclaração ainda não verificada — nunca em verificado", () => {
    renderForm();
    fireEvent.click(screen.getByLabelText("Presencial"));
    fireEvent.click(screen.getByRole("button", { name: "Revisar e submeter" }));

    expect(screen.getByText(/declaração sua/)).toBeInTheDocument();
    expect(screen.getAllByText(/ainda não verificada/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Submeter como autodeclaração" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/verificado em|informação verificada/i);
  });

  it("escolha única troca a seleção em vez de acumular", () => {
    renderForm();
    // ACESSO_PRAZO_PARA_CONSULTA é escolha única (radios).
    fireEvent.click(screen.getByLabelText("Até 7 dias"));
    fireEvent.click(screen.getByLabelText("Mais de 60 dias"));

    expect((screen.getByLabelText("Até 7 dias") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Mais de 60 dias") as HTMLInputElement).checked).toBe(true);
  });

  it("a tela nunca promete posição, ranking ou percentual", () => {
    renderForm();
    expect(document.body.textContent).not.toMatch(/ranking|posição|classificação|porcentagem|%/i);
  });
});
