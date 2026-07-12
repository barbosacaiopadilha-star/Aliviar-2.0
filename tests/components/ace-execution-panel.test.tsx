import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AceExecutionPanel } from "@/components/cases/ace-execution-panel";
import type { AceExecution } from "@/modules/concierge/types";

const { runAceExecutionActionMock } = vi.hoisted(() => ({
  runAceExecutionActionMock: vi.fn(),
}));

vi.mock("@/modules/concierge/actions", () => ({
  runAceExecutionAction: runAceExecutionActionMock,
}));

afterEach(cleanup);

beforeEach(() => {
  runAceExecutionActionMock.mockReset();
  vi.stubGlobal("location", { ...window.location, reload: vi.fn() });
});

function buildExecution(overrides: Partial<AceExecution> = {}): AceExecution {
  return {
    id: "exec-1",
    caseId: "case-1",
    startedBy: "user-1",
    startedByName: "Curador Teste",
    startedAt: new Date("2026-07-01T10:00:00Z").toISOString(),
    finishedAt: null,
    status: "RUNNING",
    currentProtocol: "P004",
    methodVersion: "ACE-0.1",
    failureCode: null,
    failureMessage: null,
    retryOf: null,
    ...overrides,
  };
}

describe("AceExecutionPanel", () => {
  it("sempre exibe o aviso de que é uma análise interna, não uma curadoria validada", () => {
    render(<AceExecutionPanel caseId="case-1" initialExecution={null} canRun />);
    expect(
      screen.getByText("Esta é uma análise interna do ACE e ainda não representa uma curadoria validada."),
    ).toBeInTheDocument();
  });

  it("sem execução prévia, mostra estado vazio explicativo e permite iniciar", () => {
    render(<AceExecutionPanel caseId="case-1" initialExecution={null} canRun />);
    expect(screen.getByText("Nenhuma execução do ACE foi iniciada para este caso ainda.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar execução do ACE" })).toBeInTheDocument();
  });

  it("não oferece o botão de iniciar/retomar quando canRun é falso", () => {
    render(<AceExecutionPanel caseId="case-1" initialExecution={null} canRun={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("execução COMPLETED não oferece nem iniciar nem retomar", () => {
    render(<AceExecutionPanel caseId="case-1" initialExecution={buildExecution({ status: "COMPLETED" })} canRun />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("execução BLOCKED oferece 'Retomar execução' e mostra a mensagem de falha em destaque", () => {
    render(
      <AceExecutionPanel
        caseId="case-1"
        initialExecution={buildExecution({
          status: "BLOCKED",
          failureCode: "CASE_AUDIT_BLOCKED",
          failureMessage: "Faltam informações essenciais para prosseguir.",
        })}
        canRun
      />,
    );
    expect(screen.getByRole("button", { name: "Retomar execução" })).toBeInTheDocument();
    expect(screen.getByText("Faltam informações essenciais para prosseguir.")).toBeInTheDocument();
  });

  it("ao iniciar com sucesso, chama a action com o caseId e recarrega a página", async () => {
    runAceExecutionActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<AceExecutionPanel caseId="case-42" initialExecution={null} canRun />);
    await user.click(screen.getByRole("button", { name: "Iniciar execução do ACE" }));

    expect(runAceExecutionActionMock).toHaveBeenCalledWith("case-42");
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("em caso de erro, exibe a mensagem sem recarregar a página", async () => {
    runAceExecutionActionMock.mockResolvedValue({ success: false, error: "Você não pode executar o ACE deste caso." });
    const user = userEvent.setup();

    render(<AceExecutionPanel caseId="case-1" initialExecution={null} canRun />);
    await user.click(screen.getByRole("button", { name: "Iniciar execução do ACE" }));

    expect(await screen.findByText("Você não pode executar o ACE deste caso.")).toBeInTheDocument();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
