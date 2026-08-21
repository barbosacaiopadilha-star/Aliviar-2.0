import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";

/**
 * A LÍNGUA DA CONEXÃO — a que sobrou depois que o legado saiu.
 *
 * Este arquivo comparava dois modos: o canônico e o da entrega do motor ACE.
 * O motor foi removido, e com ele o prop `modo` e todo o ramo legado do painel
 * — a lista de rádios, "Quero seguir com um dos três", "pode trocar aqui
 * mesmo". Sobrou a metade que continua no ar.
 *
 * Cada teste aqui guarda uma frase que a paciente lê. A asserção "o canônico
 * nunca corrige" permanece de propósito: hoje ela é verdadeira por construção,
 * e é exatamente o tipo de verdade que se perde sem ninguém notar.
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
      caseId="case-1"
      providerPresentations={pessoas}
      connection={connection as never}
    />,
  );
}

describe("A conexão canônica — a única que existe", () => {
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

    expect(screen.getByText(/Os outros dois caminhos continuam na Mesa/)).toBeInTheDocument();

    // E não promete o que a Aliviar ainda não faz.
    expect(screen.queryByText(/pode trocar aqui mesmo/)).toBeNull();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar aos caminhos" })).toBeNull();
  });

  /**
   * A_SALA_DA_DECISAO §5.1 (SD-O1) — as verdades vêm ANTES do gesto.
   *
   * Esta guarda morava em `sala-da-decisao.test.tsx`, que exercitava a Sala do
   * formato legado e saiu com ele. A doutrina não é do formato: é do Método, e
   * por isso a asserção mudou de casa em vez de morrer junto.
   */
  it("as verdades vêm ANTES do gesto, nunca depois dele", async () => {
    canonico();
    await userEvent.click(screen.getByRole("button", { name: "Abrir meu acompanhamento" }));

    const texto = document.body.textContent ?? "";
    const alcance = texto.indexOf("Não há consulta marcada");
    const gesto = texto.lastIndexOf("Abrir meu acompanhamento");

    expect(alcance).toBeGreaterThan(-1);
    expect(gesto).toBeGreaterThan(-1);
    expect(alcance, "o alcance precede o ato").toBeLessThan(gesto);
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
