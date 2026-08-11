import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { ConnectionRecord } from "@/modules/connection/types";

const {
  createConnectionActionMock,
  correctChoiceActionMock,
  routerRefreshMock,
} = vi.hoisted(() => ({
  createConnectionActionMock: vi.fn(),
  correctChoiceActionMock: vi.fn(),
  routerRefreshMock: vi.fn(),
}));

// Mocka somente a fronteira da Server Action — nunca o domínio nem o
// repository (Etapa 12: "não mockar o domínio").
vi.mock("@/modules/connection/actions", () => ({
  createConnectionAction: createConnectionActionMock,
  correctChoiceAction: correctChoiceActionMock,
}));

// PR5: o componente passou a usar router.refresh() (next/navigation) em vez
// de window.location.reload() — mesmo padrão já usado por outros client
// components desta base (ex.: tests/components/patient-shell-nav-fase2.test.tsx).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

afterEach(cleanup);

beforeEach(() => {
  createConnectionActionMock.mockReset();
  correctChoiceActionMock.mockReset();
  routerRefreshMock.mockReset();
});

const CASE_ID = "case-1";
const PROVIDER_A = "provider-a";
const PROVIDER_B = "provider-b";
const PROVIDER_C = "provider-c";

function buildPresentations(): ProviderPresentation[] {
  return [
    {
      providerId: PROVIDER_A,
      displayName: "Ana Profissional",
      professionalSummary: "",
      whyIncluded: "",
      strengthsForThisCase: [],
      relevantLimitations: [],
      practicalConsiderations: [],
    },
    {
      providerId: PROVIDER_B,
      displayName: "Bruno Profissional",
      professionalSummary: "",
      whyIncluded: "",
      strengthsForThisCase: [],
      relevantLimitations: [],
      practicalConsiderations: [],
    },
    {
      providerId: PROVIDER_C,
      displayName: "Carla Profissional",
      professionalSummary: "",
      whyIncluded: "",
      strengthsForThisCase: [],
      relevantLimitations: [],
      practicalConsiderations: [],
    },
  ];
}

function buildConnection(
  overrides: Partial<ConnectionRecord> = {},
): ConnectionRecord {
  return {
    id: "connection-1",
    caseId: CASE_ID,
    anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: "delivery-1" },
    patientProfileId: "patient-1",
    professionalProfileId: PROVIDER_A,
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    decidedAt: "2026-07-15T10:00:00.000Z",
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("ConnectionChoicePanel — sem Connection", () => {
  it("renderiza os três profissionais sem ranking, nenhum pré-selecionado", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    for (const radio of radios) {
      expect(radio).not.toBeChecked();
    }
    // Nenhum vocabulário de ranking/hierarquia.
    const text = document.body.textContent!.toLowerCase();
    for (const forbidden of [
      "melhor",
      "recomendado",
      "mais compatível",
      "1º",
      "2º",
      "3º",
      "score",
      "nota",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("mantém o gesto do limiar desabilitado sem seleção", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Quero seguir com um dos três" }),
    ).toBeDisabled();
  });

  it("permite selecionar e trocar localmente, sem chamar a action antes da confirmação", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Ana Profissional" }));
    expect(
      screen.getByRole("radio", { name: "Ana Profissional" }),
    ).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Bruno Profissional" }));
    expect(
      screen.getByRole("radio", { name: "Bruno Profissional" }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Ana Profissional" }),
    ).not.toBeChecked();

    expect(createConnectionActionMock).not.toHaveBeenCalled();
  });

  it("mostra a etapa de revisão antes de persistir, e só chama a action ao confirmar", async () => {
    createConnectionActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Carla Profissional" }));
    await user.click(
      screen.getByRole("button", { name: "Quero seguir com Carla Profissional" }),
    );

    expect(
      screen.getByText(/Você escolheu seguir com Carla Profissional/),
    ).toBeInTheDocument();
    expect(createConnectionActionMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Seguir com Carla Profissional" }),
    );
    expect(createConnectionActionMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
      professionalProfileId: PROVIDER_C,
    });
  });

  it("'Voltar aos caminhos' volta à seleção sem persistir", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Ana Profissional" }));
    await user.click(
      screen.getByRole("button", { name: "Quero seguir com Ana Profissional" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Voltar aos caminhos" }),
    );

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(createConnectionActionMock).not.toHaveBeenCalled();
  });
});

describe("ConnectionChoicePanel — Connection em DECISAO_REGISTRADA", () => {
  it("exibe a escolha atual e oferece correção", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={buildConnection()}
      />,
    );
    expect(
      screen.getByText(/Você escolheu seguir com Ana Profissional/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Alterar minha escolha" }),
    ).toBeInTheDocument();
  });

  it("ao corrigir, chama correctChoiceAction com o novo profissional", async () => {
    correctChoiceActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={buildConnection()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Alterar minha escolha" }),
    );
    await user.click(screen.getByRole("radio", { name: "Bruno Profissional" }));
    await user.click(
      screen.getByRole("button", { name: "Quero seguir com Bruno Profissional" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Seguir com Bruno Profissional" }),
    );

    expect(correctChoiceActionMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
      newProfessionalProfileId: PROVIDER_B,
    });
    expect(createConnectionActionMock).not.toHaveBeenCalled();
  });
});

describe("ConnectionChoicePanel — estados além de DECISAO_REGISTRADA", () => {
  // A partir do PR5, todo o conteúdo real de CONTATO_INICIADO/
  // PRIMEIRO_ATENDIMENTO_REALIZADO/ENCERRADO_SEM_RELACIONAMENTO é
  // responsabilidade de ConnectionProgressPanel (tests/components/
  // connection-progress-panel.test.tsx) — aqui só confirmamos que
  // ConnectionChoicePanel delega corretamente, sem duplicar a asserção
  // profunda de conteúdo.
  it("CONTATO_INICIADO: delega para ConnectionProgressPanel, nenhum rádio/correção aqui", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={buildConnection({ status: "CONTATO_INICIADO" })}
      />,
    );

    expect(
      screen.getByText(/Você registrou que iniciou o contato/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Alterar minha escolha" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("PRIMEIRO_ATENDIMENTO_REALIZADO: delega para ConnectionProgressPanel, estado terminal", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={buildConnection({
          status: "PRIMEIRO_ATENDIMENTO_REALIZADO",
        })}
      />,
    );
    expect(
      screen.getByText(/Primeiro atendimento confirmado/),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("ConnectionChoicePanel — erros", () => {
  it("exibe o erro da action com segurança, preserva a seleção e permite reenviar", async () => {
    createConnectionActionMock.mockResolvedValueOnce({
      success: false,
      error: "O profissional escolhido não faz parte da sua Curadoria.",
    });
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Ana Profissional" }));
    await user.click(
      screen.getByRole("button", { name: "Quero seguir com Ana Profissional" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Seguir com Ana Profissional" }),
    );

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(
        "O profissional escolhido não faz parte da sua Curadoria.",
      ),
    ).toBeInTheDocument();
    expect(alert.textContent).not.toMatch(
      /sql|stack|23505|constraint|rpc|connection_records/i,
    );

    // Seleção preservada — reenvio possível sem re-selecionar.
    expect(
      screen.getByText(/Você escolheu seguir com Ana Profissional/),
    ).toBeInTheDocument();

    createConnectionActionMock.mockResolvedValueOnce({ success: true });
    await user.click(
      screen.getByRole("button", { name: "Seguir com Ana Profissional" }),
    );
    expect(createConnectionActionMock).toHaveBeenCalledTimes(2);
  });
});

describe("ConnectionChoicePanel — acessibilidade", () => {
  it("agrupa as opções em um fieldset com legend, e cada rádio tem nome acessível", () => {
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );
    const group = screen.getByRole("group");
    expect(group.tagName.toLowerCase()).toBe("fieldset");
    expect(
      within(group).getByRole("radio", { name: "Ana Profissional" }),
    ).toBeInTheDocument();
  });

  it("permite navegação e seleção via teclado", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionChoicePanel modo="legado"
        caseId={CASE_ID}
        providerPresentations={buildPresentations()}
        connection={null}
      />,
    );

    await user.tab();
    const firstRadio = screen.getByRole("radio", { name: "Ana Profissional" });
    expect(firstRadio).toHaveFocus();

    await user.keyboard(" ");
    expect(firstRadio).toBeChecked();
  });
});
