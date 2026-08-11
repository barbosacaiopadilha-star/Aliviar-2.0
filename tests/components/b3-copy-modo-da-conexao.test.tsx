import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";

/**
 * B3-COPY · o canônico e o legado falam línguas diferentes, de propósito.
 *
 * A Arquitetura E já filtrava os DADOS — `opcoesDaConexao` entrega uma pessoa.
 * A linguagem é que ficou para trás: um rádio não marcado, com uma opção, sob
 * um botão que falava em três (achado da EV-B3-004).
 *
 * O modo é DITO pela rota. Inferir por `providerPresentations.length === 1`
 * erraria nas duas pontas: entrega legada pode ter um só, e o estado R3
 * também chega com um sendo canônico.
 */

const createConnectionActionMock = vi.fn();
const correctChoiceActionMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/connection/actions", () => ({
  createConnectionAction: (i: unknown) => createConnectionActionMock(i),
  correctChoiceAction: (i: unknown) => correctChoiceActionMock(i),
  registerContactIntentAction: vi.fn(),
  confirmFirstAppointmentAction: vi.fn(),
  closeWithoutRelationshipAction: vi.fn(),
  setContactModeAction: vi.fn(),
}));

const DECIDIDA = {
  providerId: "prof-a",
  displayName: "Dra. Helena Monteiro",
  professionalSummary: "",
  whyIncluded: "",
  strengthsForThisCase: [],
  relevantLimitations: [],
  practicalConsiderations: [],
};

const TRES = [
  DECIDIDA,
  { ...DECIDIDA, providerId: "prof-b", displayName: "Dr. Rafael Nogueira" },
  { ...DECIDIDA, providerId: "prof-c", displayName: "Dra. Marina Azevedo" },
];

const ABERTA = {
  id: "c1",
  caseId: "case-1",
  professionalProfileId: "prof-a",
  status: "DECISAO_REGISTRADA",
  contactMode: null,
};

beforeEach(() => {
  createConnectionActionMock.mockReset().mockResolvedValue({ success: true });
  correctChoiceActionMock.mockReset().mockResolvedValue({ success: true });
});

afterEach(cleanup);

function canonico(connection: unknown = null, pessoas = [DECIDIDA]) {
  return render(
    <ConnectionChoicePanel
      modo="canonico"
      caseId="case-1"
      providerPresentations={pessoas}
      connection={connection as never}
    />,
  );
}

function legado(connection: unknown = null) {
  return render(
    <ConnectionChoicePanel
      modo="legado"
      caseId="case-1"
      providerPresentations={TRES}
      connection={connection as never}
    />,
  );
}

describe("B3-COPY · modo canônico", () => {
  it("abertura fala de começar, não de escolher", () => {
    canonico();

    expect(screen.getByRole("heading", { name: "Começar seu acompanhamento" })).toBeInTheDocument();
    expect(screen.getByText("Caminho escolhido: Dra. Helena Monteiro")).toBeInTheDocument();
    expect(
      screen.getByText(/Sua decisão já está registrada\. Abrir o acompanhamento é o passo seguinte/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir meu acompanhamento" })).toBeInTheDocument();
  });

  it("a pessoa decidida é informação FIXA — não há o que marcar", () => {
    canonico();

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  /** Guarda que pega regressão de copy melhor que asserção por asserção. */
  it("nenhuma frase do legado sobrevive no canônico", () => {
    const { container } = canonico();
    const texto = container.textContent ?? "";

    for (const proibida of [
      "Com quem você gostaria de seguir",
      "um dos três",
      "Os profissionais foram apresentados",
      "ordem de preferência",
    ]) {
      expect(texto, `copy legada vazou no canônico: ${proibida}`).not.toContain(proibida);
    }
  });

  it("revisão traz as cinco verdades, e a quinta é a que o append-only exige", async () => {
    canonico();
    await userEvent.click(screen.getByRole("button", { name: "Abrir meu acompanhamento" }));

    expect(
      screen.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/passa a ser visível para quem cuida do seu caso/)).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi procurado/)).toBeInTheDocument();
    expect(screen.getByText(/nunca fica sem alguém respondendo por ele/)).toBeInTheDocument();
    expect(
      screen.getByText(/Sua decisão continua registrada do jeito que está/),
      "a quinta verdade substitui a promessa legada de trocar depois",
    ).toBeInTheDocument();

    // E não promete o que a Aliviar ainda não faz.
    expect(screen.queryByText(/pode trocar aqui mesmo/)).toBeNull();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar aos caminhos" })).toBeNull();
  });

  it("confirmar chama a action com a pessoa decidida, e nunca a correção", async () => {
    canonico();
    await userEvent.click(screen.getByRole("button", { name: "Abrir meu acompanhamento" }));
    await userEvent.click(screen.getByRole("button", { name: "Abrir meu acompanhamento" }));

    expect(createConnectionActionMock).toHaveBeenCalledWith({
      caseId: "case-1",
      professionalProfileId: "prof-a",
    });
    expect(correctChoiceActionMock, "o canônico nunca corrige").not.toHaveBeenCalled();
  });

  it("acompanhamento aberto: sem alterar escolha e sem via para corrigir", () => {
    canonico(ABERTA);

    expect(screen.getByText("Acompanhamento aberto com Dra. Helena Monteiro.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alterar minha escolha" })).toBeNull();
    expect(screen.queryByText("Você escolheu seguir com Dra. Helena Monteiro.")).toBeNull();
  });

  it("sem pessoa não renderiza nada — nunca um card com nome indefinido", () => {
    const { container } = canonico(null, []);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("B3-COPY · modo legado, congelado", () => {
  it("a copy da escolha permanece palavra por palavra", () => {
    legado();

    expect(
      screen.getByRole("heading", { name: "Com quem você gostaria de seguir?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Os profissionais foram apresentados sem ordem de preferência/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quero seguir com um dos três" })).toBeInTheDocument();
  });

  it("os três rádios continuam lá", () => {
    legado();

    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("a revisão legada mantém a promessa de trocar — que só vale aqui", async () => {
    legado();
    await userEvent.click(screen.getByRole("radio", { name: "Dr. Rafael Nogueira" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Quero seguir com Dr. Rafael Nogueira" }),
    );

    expect(screen.getByText(/pode trocar aqui mesmo, sem precisar explicar nada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar aos caminhos" })).toBeInTheDocument();
  });

  it("alterar a escolha sobrevive no legado", () => {
    legado(ABERTA);

    expect(screen.getByRole("button", { name: "Alterar minha escolha" })).toBeInTheDocument();
    expect(screen.getByText("Você escolheu seguir com Dra. Helena Monteiro.")).toBeInTheDocument();
  });
});
