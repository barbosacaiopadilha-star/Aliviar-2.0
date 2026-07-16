import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { RelationshipRecord } from "@/modules/relationship";

// [CORRIGIDO — Fase 6.1] declareRelationshipPauseAction/
// declareRelationshipResumeAction removidas junto com o estado PAUSADO
// (docs/architecture/DOMAIN_RELATIONSHIP.md, Fase 4.1). Os dois estados
// terminais anteriores (ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO)
// foram consolidados em um único ENCERRADO.
const { closeActionMock, interruptActionMock, routerRefreshMock } = vi.hoisted(
  () => ({
    closeActionMock: vi.fn(),
    interruptActionMock: vi.fn(),
    routerRefreshMock: vi.fn(),
  }),
);

// Mocka somente a fronteira das Server Actions — nunca o domínio nem o
// repository (mesma convenção já usada em connection-progress-panel.test.tsx).
vi.mock("@/modules/relationship/actions", () => ({
  declarePlannedRelationshipClosureAction: closeActionMock,
  declareRelationshipInterruptionAction: interruptActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

afterEach(cleanup);

beforeEach(() => {
  closeActionMock.mockReset();
  interruptActionMock.mockReset();
  routerRefreshMock.mockReset();
});

const CASE_ID = "case-1";
const PROFESSIONAL_ID = "professional-1";
const NOW = "2026-07-15T10:00:00.000Z";

function buildPresentations(): ProviderPresentation[] {
  return [
    {
      providerId: PROFESSIONAL_ID,
      displayName: "Ana Profissional",
      professionalSummary: "",
      whyIncluded: "",
      strengthsForThisCase: [],
      relevantLimitations: [],
      practicalConsiderations: [],
    },
  ];
}

function buildRelationship(
  overrides: Partial<RelationshipRecord> = {},
): RelationshipRecord {
  return {
    id: "relationship-1",
    connectionId: "connection-1",
    caseId: CASE_ID,
    patientProfileId: "patient-1",
    professionalProfileId: PROFESSIONAL_ID,
    status: "ATIVO",
    startedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("RelationshipStatusPanel — ATIVO", () => {
  it("exibe o profissional associado e não persiste nada antes da confirmação", async () => {
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(screen.getByText(/está registrado como ativo/)).toBeInTheDocument();
    expect(screen.getByText(/Ana Profissional/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    expect(screen.getByText(/registro é final/)).toBeInTheDocument();
    expect(closeActionMock).not.toHaveBeenCalled();
  });

  it("encerramento planejado exige revisão, e chama a action só na confirmação", async () => {
    closeActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );

    expect(closeActionMock).toHaveBeenCalledWith({ caseId: CASE_ID });
    expect(routerRefreshMock).toHaveBeenCalled();
  });

  it("'Voltar' na revisão de encerramento retorna sem persistir", async () => {
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByText(/está registrado como ativo/)).toBeInTheDocument();
    expect(closeActionMock).not.toHaveBeenCalled();
  });

  it("interrupção (ação discreta) exige revisão e chama a action correspondente, sem enviar observação", async () => {
    interruptActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "O acompanhamento foi interrompido" }),
    );
    expect(screen.getByText(/não avalia Ana Profissional/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Confirmar interrupção" }),
    );
    expect(interruptActionMock).toHaveBeenCalledWith({ caseId: CASE_ID });
    expect(interruptActionMock.mock.calls[0][0]).not.toHaveProperty(
      "observation",
    );
  });

  it("nenhuma ação envia patientProfileId, ator, connectionId ou professionalProfileId", async () => {
    closeActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );

    const call = closeActionMock.mock.calls[0][0];
    expect(Object.keys(call)).toEqual(["caseId"]);
  });

  it("nenhum botão de pausa/retomada existe — PAUSADO não é estado oficial", () => {
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /pausar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retomar/i }),
    ).not.toBeInTheDocument();
  });
});

describe("RelationshipStatusPanel — estado terminal ENCERRADO", () => {
  it("zero CTAs, nenhuma avaliação, nenhuma reabertura, nenhuma menção a PAUSADO", () => {
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship({ status: "ENCERRADO" })}
        providerPresentations={buildPresentations()}
      />,
    );

    expect(screen.getByText(/registrado como encerrado/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    const text = document.body.textContent!.toLowerCase();
    for (const forbidden of [
      "avaliação",
      "estrela",
      "score",
      "reabrir",
      "nova curadoria",
      "trocar profissional",
      "pausado",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe("RelationshipStatusPanel — erros e concorrência", () => {
  it("exibe o erro da action com segurança, preserva a etapa e permite reenviar", async () => {
    closeActionMock.mockResolvedValueOnce({
      success: false,
      error:
        "Este Relationship foi alterado por outra ação ao mesmo tempo. Atualize a página e tente novamente.",
    });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText(/alterado por outra ação ao mesmo tempo/),
    ).toBeInTheDocument();
    expect(alert.textContent).not.toMatch(
      /sql|stack|23505|constraint|rpc|relationship_records/i,
    );

    // Etapa de revisão preservada — reenvio possível sem perder o estado.
    expect(screen.getByText(/registro é final/)).toBeInTheDocument();

    closeActionMock.mockResolvedValueOnce({ success: true });
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );
    expect(closeActionMock).toHaveBeenCalledTimes(2);
  });

  it("não reenvia automaticamente após erro — exige nova ação explícita do usuário", async () => {
    closeActionMock.mockResolvedValueOnce({
      success: false,
      error: "Erro qualquer.",
    });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );
    await screen.findByRole("alert");

    expect(closeActionMock).toHaveBeenCalledTimes(1);
  });
});

describe("RelationshipStatusPanel — acessibilidade", () => {
  it("cada estado tem exatamente um heading, sem duplicação", () => {
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("permite navegação e ativação via teclado", async () => {
    closeActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/registro é final/)).toBeInTheDocument();
  });

  it("mensagem de erro usa role=alert", async () => {
    closeActionMock.mockResolvedValueOnce({
      success: false,
      error: "Falha qualquer.",
    });
    const user = userEvent.setup();
    render(
      <RelationshipStatusPanel
        caseId={CASE_ID}
        relationship={buildRelationship()}
        providerPresentations={buildPresentations()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Registrar encerramento planejado" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar encerramento" }),
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
