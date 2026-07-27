import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionProgressPanel } from "@/components/patient/connection-progress-panel";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { ConnectionRecord } from "@/modules/connection/types";

const {
  registerContactIntentActionMock,
  confirmFirstAppointmentActionMock,
  closeWithoutRelationshipActionMock,
  routerRefreshMock,
} = vi.hoisted(() => ({
  registerContactIntentActionMock: vi.fn(),
  confirmFirstAppointmentActionMock: vi.fn(),
  closeWithoutRelationshipActionMock: vi.fn(),
  routerRefreshMock: vi.fn(),
}));

// Mocka somente a fronteira da Server Action — nunca o domínio (Etapa 12).
vi.mock("@/modules/connection/actions", () => ({
  registerContactIntentAction: registerContactIntentActionMock,
  confirmFirstAppointmentAction: confirmFirstAppointmentActionMock,
  closeWithoutRelationshipAction: closeWithoutRelationshipActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

afterEach(cleanup);

beforeEach(() => {
  registerContactIntentActionMock.mockReset();
  confirmFirstAppointmentActionMock.mockReset();
  closeWithoutRelationshipActionMock.mockReset();
  routerRefreshMock.mockReset();
});

const CASE_ID = "case-1";
const PROVIDER_A = "provider-a";

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
    decidedAt: "2026-07-15T10:00:00.000Z",
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("ConnectionProgressPanel — DECISAO_REGISTRADA", () => {
  it("mostra a escolha atual e o botão de correção quando onRequestEdit é fornecido", () => {
    const onRequestEdit = vi.fn();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
        onRequestEdit={onRequestEdit}
      />,
    );

    expect(
      screen.getByText(/Você escolheu seguir com Ana Profissional/),
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Alterar minha escolha" }).click();
    expect(onRequestEdit).toHaveBeenCalledTimes(1);
  });

  it("não mostra correção quando onRequestEdit não é fornecido", () => {
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Alterar minha escolha" }),
    ).not.toBeInTheDocument();
  });

  it("'Já iniciei o contato' chama registerContactIntentAction diretamente, sem etapa de revisão", async () => {
    registerContactIntentActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Já iniciei o contato" }),
    );
    expect(registerContactIntentActionMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
    });
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });

  it("'O primeiro atendimento já aconteceu' abre revisão antes de persistir", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "O primeiro atendimento já aconteceu",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Confirmar primeiro atendimento" }),
    ).toBeInTheDocument();
    expect(confirmFirstAppointmentActionMock).not.toHaveBeenCalled();

    confirmFirstAppointmentActionMock.mockResolvedValue({ success: true });
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirmFirstAppointmentActionMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
    });
  });

  it("'O contato não avançou' abre revisão antes de persistir, sem exigir motivo", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "O contato não avançou" }),
    );
    expect(
      screen.getByRole("heading", { name: "Encerrar sem continuar" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(closeWithoutRelationshipActionMock).not.toHaveBeenCalled();

    closeWithoutRelationshipActionMock.mockResolvedValue({ success: true });
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );
    expect(closeWithoutRelationshipActionMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
    });
  });

  it("'Voltar' na revisão não persiste nada", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "O primeiro atendimento já aconteceu",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(
      screen.getByRole("button", { name: "Já iniciei o contato" }),
    ).toBeInTheDocument();
    expect(confirmFirstAppointmentActionMock).not.toHaveBeenCalled();
  });
});

describe("ConnectionProgressPanel — CONTATO_INICIADO", () => {
  it("preserva a escolha, sem correção e sem 'Já iniciei o contato'", () => {
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection({ status: "CONTATO_INICIADO" })}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(
      screen.getByText(
        /Você registrou que iniciou o contato com Ana Profissional/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Alterar minha escolha" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Já iniciei o contato" }),
    ).not.toBeInTheDocument();
  });

  it("oferece confirmar atendimento e encerrar, ambos com revisão", async () => {
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection({ status: "CONTATO_INICIADO" })}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirmar primeiro atendimento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "O contato não avançou" }),
    ).toBeInTheDocument();

    confirmFirstAppointmentActionMock.mockResolvedValue({ success: true });
    await user.click(
      screen.getByRole("button", { name: "Confirmar primeiro atendimento" }),
    );
    expect(
      screen.getByRole("heading", { name: "Confirmar primeiro atendimento" }),
    ).toBeInTheDocument();
    expect(confirmFirstAppointmentActionMock).not.toHaveBeenCalled();
  });
});

describe("ConnectionProgressPanel — PRIMEIRO_ATENDIMENTO_REALIZADO (estado terminal)", () => {
  it("mostra mensagem factual, sem CTA, sem avaliação, sem menção a Relationship", () => {
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection({
          status: "PRIMEIRO_ATENDIMENTO_REALIZADO",
        })}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Primeiro atendimento confirmado" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    const text = document.body.textContent!.toLowerCase();
    for (const forbidden of [
      "avalie",
      "avaliação",
      "estrela",
      "nota",
      "relationship",
      "acompanhamento contínuo",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe("ConnectionProgressPanel — ENCERRADO_SEM_RELACIONAMENTO (estado terminal)", () => {
  it("mostra mensagem factual, sem CTA, sem motivo, sem nova Curadoria", () => {
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection({ status: "ENCERRADO_SEM_RELACIONAMENTO" })}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Contato encerrado" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    const text = document.body.textContent!.toLowerCase();
    for (const forbidden of [
      "motivo",
      "nova curadoria",
      "tentar outro",
      "reabrir",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe("ConnectionProgressPanel — erros e concorrência", () => {
  it("exibe mensagem segura, preserva a etapa de revisão, e permite reenviar", async () => {
    confirmFirstAppointmentActionMock.mockResolvedValueOnce({
      success: false,
      error:
        "Este Connection foi alterado por outra ação ao mesmo tempo. Atualize a página e tente novamente.",
    });
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "O primeiro atendimento já aconteceu",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Este Connection foi alterado por outra ação ao mesmo tempo.",
    );
    expect(alert.textContent).not.toMatch(
      /sql|stack|23505|55000|rpc|connection_records/i,
    );

    // Permanece na etapa de revisão — reenvio possível sem perder contexto.
    expect(
      screen.getByRole("heading", { name: "Confirmar primeiro atendimento" }),
    ).toBeInTheDocument();

    confirmFirstAppointmentActionMock.mockResolvedValueOnce({ success: true });
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirmFirstAppointmentActionMock).toHaveBeenCalledTimes(2);
  });
});

describe("ConnectionProgressPanel — acessibilidade", () => {
  it("cada etapa tem um heading próprio (nenhuma duplicação de h2)", () => {
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("navegação por teclado alcança e aciona as ações", async () => {
    registerContactIntentActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Já iniciei o contato" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(registerContactIntentActionMock).toHaveBeenCalledTimes(1);
  });

  it("mensagem de erro é anunciada via role=alert", async () => {
    closeWithoutRelationshipActionMock.mockResolvedValueOnce({
      success: false,
      error: "Não foi possível concluir esta ação.",
    });
    const user = userEvent.setup();
    render(
      <ConnectionProgressPanel
        caseId={CASE_ID}
        connection={buildConnection()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "O contato não avançou" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
