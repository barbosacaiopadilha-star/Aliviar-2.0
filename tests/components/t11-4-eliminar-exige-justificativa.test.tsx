/**
 * T-11-4 · C6 — ELIMINAR SEM JUSTIFICATIVA É RECUSADO NO CLIENTE.
 *
 * O que restou do Bloco 11 depois que a Mesa antiga saiu (ADR-093). Os outros
 * itens — encerrar sempre visível, contador e frase de UMA derivação, a
 * justificativa do conjunto nomeada uma vez — provavam a apresentação do
 * `MesaWorkspace` e do `MesaHeader`, que saíram com ela. As regras de domínio
 * que eles protegiam não saíram: a Mesa nova as cumpre por outra superfície, e
 * o contrato do editor do Relatório segue provado em `report-editor-roundtrip`.
 *
 * Este item fica porque o painel de elegibilidade ATRAVESSOU a mudança
 * inteiro: é a mesma `EligibilityPanel` que a Mesa nova renderiza, e eliminar
 * alguém continua sendo o ato mais pesado que a Mesa pratica — o único cujo
 * efeito a paciente nunca poderá auditar.
 *
 * T-11-5 (a guarda do SERVIDOR do C6) é de integração e vive fora daqui — o
 * ponto do C6 é que as duas existem, não que uma substituiu a outra.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";

const { declareAreaMock } = vi.hoisted(() => ({ declareAreaMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/modules/curadoria/cruzamento-actions", () => ({
  declareAreaAction: declareAreaMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CASE_ID = "00000000-0000-0000-0000-00000000b110";
const PROF_A = "00000000-0000-0000-0000-0000000000a1";

describe("T-11-4 · C6 — eliminação sem justificativa é recusada no cliente", () => {
  const view = {
    areaRequirement: "Coluna",
    profileAcknowledged: true,
    counts: { found: 1, selected: 0 },
    mapaPendentes: 0,
    comparison: [],
    professionals: [
      {
        professionalProfileId: PROF_A,
        displayName: "Dra. Fixture A",
        areaRawText: "Ortopedia geral",
        areaTags: [],
        areaSource: "cadastro",
        areaVerificationStatus: "não verificado",
        areaVerifiedAt: null,
        cityUf: "SP",
        declaration: null,
        eligibility: {
          state: "AGUARDANDO_DECLARACAO",
          reason: "Área ainda não declarada pelo Curador.",
          filters: [],
        },
      },
    ],
  };

  async function abrirDeclaracao() {
    const user = userEvent.setup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EligibilityPanel view={view as any} />);
    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    return user;
  }

  it("escolher ELIMINADO sem escrever o motivo mantém o registro indisponível", async () => {
    const user = await abrirDeclaracao();

    await user.click(screen.getByRole("button", { name: "Incompatível" }));

    const registrar = screen.getByRole("button", { name: "Registrar declaração" });
    expect(registrar, "o cliente ainda deixa eliminar sem motivo").toBeDisabled();

    const aviso = document.getElementById(`falta-justificativa-${PROF_A}`);
    expect(aviso, "a tela não diz por que o registro está indisponível").not.toBeNull();
    expect(aviso!.textContent).toMatch(/Eliminar exige justificativa/i);
    expect(registrar.getAttribute("aria-describedby")).toBe(`falta-justificativa-${PROF_A}`);
  });

  it("nenhuma action é chamada enquanto o motivo estiver vazio", async () => {
    const user = await abrirDeclaracao();
    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.click(screen.getByRole("button", { name: "Registrar declaração" }));

    expect(
      declareAreaMock,
      "o cliente enviou uma eliminação sem motivo e deixou o servidor recusar",
    ).not.toHaveBeenCalled();
  });

  it("escrever o motivo libera o registro — a exigência é do conteúdo, não do clique", async () => {
    const user = await abrirDeclaracao();
    declareAreaMock.mockResolvedValue({ success: true });

    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.type(
      screen.getByLabelText("Justificativa"),
      "A área declarada não alcança o quadro deste caso.",
    );

    const registrar = screen.getByRole("button", { name: "Registrar declaração" });
    expect(registrar).toBeEnabled();

    await user.click(registrar);
    expect(declareAreaMock).toHaveBeenCalledTimes(1);
    expect(declareAreaMock.mock.calls[0]![0]).toMatchObject({
      compatibility: "INCOMPATIVEL",
      rationale: "A área declarada não alcança o quadro deste caso.",
    });
  });

  it("espaço em branco não é justificativa", async () => {
    const user = await abrirDeclaracao();

    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.type(screen.getByLabelText("Justificativa"), "    ");

    expect(screen.getByRole("button", { name: "Registrar declaração" })).toBeDisabled();
  });
});
