import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MENSAGENS_DO_DESFECHO } from "@/modules/paciente/desfecho-mensagens";
import type { AtoSobreATraducao } from "@/modules/paciente/reconhecimento-contrato";

/**
 * ETAPA 2C — OS QUATRO DESFECHOS, OPERACIONAIS.
 *
 * O que estes testes protegem: que ela pratique os quatro pelo caminho
 * autorizado do PP-03 (a action dela, nunca a do Curador), que os dois que
 * afirmam algo exijam o texto (DT-22), que "pendente" não escreva nada, e que
 * nenhum retorno nomeado da RPC chegue à tela como frase genérica.
 */

const mocks = vi.hoisted(() => ({ registrar: vi.fn() }));

vi.mock("@/modules/paciente/desfecho-actions", () => ({
  registrarDesfechoAction: mocks.registrar,
}));

const { DesfechosDoConceito } = await import("@/components/paciente/desfechos-do-conceito");

afterEach(cleanup);

const ATO: AtoSobreATraducao = {
  houveTraducao: true,
  desfecho: "PENDENTE",
  leituraProposta: "Entendi que você quer explicações em palavras simples.",
  correcao: null,
};

function renderizar(ato: Partial<AtoSobreATraducao> = {}) {
  return render(
    <DesfechosDoConceito
      caseId="c1"
      subcriterionCode="MODELO_COMUNICACAO"
      label="Como explica"
      ato={{ ...ATO, ...ato }}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.registrar.mockResolvedValue({ success: true, desfecho: "RECONHECIDA" });
});

describe("C5 · os quatro, com o mesmo peso", () => {
  it("os quatro desfechos são oferecidos no mesmo lugar", () => {
    renderizar();

    for (const rotulo of [
      "É isso mesmo",
      "Quase — quero ajustar",
      "Não foi isso que eu disse",
      "Prefiro pensar",
    ]) {
      expect(screen.getByRole("button", { name: rotulo }), rotulo).toBeInTheDocument();
    }
  });

  it("mesmo peso visual: nenhum botão se destaca dos outros", () => {
    renderizar();

    const classes = screen.getAllByRole("button").map((b) => b.className);
    expect(new Set(classes).size, "um dos desfechos tem estilo próprio").toBe(1);
    // Nenhum é o botão "de ação principal" da casa.
    expect(classes[0]).not.toContain("bg-brand-primary");
  });

  it("mesma distância: cada um está a um passo do estado inicial", async () => {
    renderizar();
    // "É isso mesmo" registra direto; os outros três abrem o próprio passo.
    await userEvent.click(screen.getByRole("button", { name: "É isso mesmo" }));
    expect(mocks.registrar).toHaveBeenCalledTimes(1);
  });

  it("a leitura sobre a qual ela se manifesta fica à vista", () => {
    renderizar();
    expect(screen.getByText(/Entendi que você quer explicações/)).toBeInTheDocument();
  });
});

describe("C1/C2/C3 · os três que escrevem", () => {
  it("RECONHECIDA vai pela action dela, sem texto", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "É isso mesmo" }));

    expect(mocks.registrar).toHaveBeenCalledWith({
      caseId: "c1",
      subcriterionCode: "MODELO_COMUNICACAO",
      acknowledgment: "RECONHECIDA",
      correction: null,
    });
  });

  it("CORRIGIDA exige o texto dela antes de registrar (DT-22)", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Quase — quero ajustar" }));

    expect(screen.getByRole("button", { name: "Registrar" })).toBeDisabled();
    expect(screen.getByText(/fica o estado sem o motivo/)).toBeInTheDocument();
    expect(mocks.registrar).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole("textbox"), "prefiro com detalhes");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect(mocks.registrar).toHaveBeenCalledWith({
      caseId: "c1",
      subcriterionCode: "MODELO_COMUNICACAO",
      acknowledgment: "CORRIGIDA",
      correction: "prefiro com detalhes",
    });
  });

  it("RECUSADA exige o texto dela e vai pelo mesmo caminho", async () => {
    mocks.registrar.mockResolvedValue({ success: true, desfecho: "RECUSADA" });
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Não foi isso que eu disse" }));
    await userEvent.type(screen.getByRole("textbox"), "não foi isso");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect(mocks.registrar).toHaveBeenCalledWith({
      caseId: "c1",
      subcriterionCode: "MODELO_COMUNICACAO",
      acknowledgment: "RECUSADA",
      correction: "não foi isso",
    });
  });

  it("depois do ato, a tela conta o que ficou — e não reabre o formulário", async () => {
    mocks.registrar.mockResolvedValue({ success: true, desfecho: "RECUSADA" });
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Não foi isso que eu disse" }));
    await userEvent.type(screen.getByRole("textbox"), "não foi isso");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect(screen.getByText("Você discordou desta leitura.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "É isso mesmo" })).not.toBeInTheDocument();
  });
});

describe("C4 · pendente não escreve nada", () => {
  it("praticá-lo não chama action nenhuma", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Prefiro pensar" }));

    expect(mocks.registrar).not.toHaveBeenCalled();
    expect(screen.getByText(/Nada foi registrado sobre como explica/)).toBeInTheDocument();
  });

  it("o retorno posterior continua possível", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Prefiro pensar" }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar às opções" }));

    expect(screen.getByRole("button", { name: "É isso mesmo" })).toBeInTheDocument();
  });
});

describe("O que não se oferece", () => {
  it("sem tradução, não há desfecho — ninguém interpretou o que ela disse", () => {
    const { container } = renderizar({ houveTraducao: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("desfecho já praticado não regride nem é reescrito (JA_RESPONDIDO)", () => {
    renderizar({ desfecho: "CORRIGIDA", correcao: "eu disse outra coisa" });

    expect(screen.getByText("Você pediu um ajuste nesta leitura.")).toBeInTheDocument();
    expect(screen.getByText(/eu disse outra coisa/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("C8/C9 · cada retorno da RPC tem a própria frase", () => {
  it.each(Object.entries(MENSAGENS_DO_DESFECHO))(
    "%s chega à tela com a frase específica, nunca a genérica",
    async (_retorno, frase) => {
      mocks.registrar.mockResolvedValue({ success: false, error: frase });
      renderizar();

      await userEvent.click(screen.getByRole("button", { name: "É isso mesmo" }));

      const alerta = await screen.findByRole("alert");
      expect(alerta.textContent).toBe(frase);
      expect(alerta.textContent).not.toContain("Não foi possível registrar agora");
    },
  );
});
