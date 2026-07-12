import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AceExecutionsTable } from "@/components/ace/ace-executions-table";
import type { AceExecutionOverview } from "@/modules/concierge/types";

afterEach(cleanup);

function buildExecution(overrides: Partial<AceExecutionOverview> = {}): AceExecutionOverview {
  return {
    id: "exec-1",
    caseId: "case-1",
    startedBy: "curador-1",
    startedByName: "Curador Um",
    startedAt: new Date("2026-07-01T10:00:00Z").toISOString(),
    finishedAt: null,
    status: "RUNNING",
    currentProtocol: "P004",
    methodVersion: "ACE-0.1",
    failureCode: null,
    failureMessage: null,
    retryOf: null,
    patientName: "Paciente Um",
    caseStatus: "IN_CURATION",
    ...overrides,
  };
}

describe("AceExecutionsTable", () => {
  it("mostra estado vazio quando não há execuções", () => {
    render(<AceExecutionsTable executions={[]} curators={[]} />);
    expect(screen.getByText("Nenhuma execução do ACE ainda.")).toBeInTheDocument();
  });

  it("lista as execuções com paciente, status e protocolo atual", () => {
    render(<AceExecutionsTable executions={[buildExecution()]} curators={[]} />);
    const table = within(screen.getByRole("table"));
    expect(table.getByText("Paciente Um")).toBeInTheDocument();
    expect(table.getByText("Em execução")).toBeInTheDocument();
    expect(table.getByText("P004")).toBeInTheDocument();
  });

  it("filtra por busca de paciente", async () => {
    const executions = [
      buildExecution({ id: "exec-1", patientName: "Ana Silva" }),
      buildExecution({ id: "exec-2", patientName: "Beatriz Souza" }),
    ];
    const user = userEvent.setup();
    render(<AceExecutionsTable executions={executions} curators={[]} />);

    await user.type(screen.getByLabelText("Buscar por paciente ou id do caso"), "ana");

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByText("Beatriz Souza")).not.toBeInTheDocument();
  });

  it("filtra por status", async () => {
    const executions = [
      buildExecution({ id: "exec-1", patientName: "Ana Silva", status: "COMPLETED" }),
      buildExecution({ id: "exec-2", patientName: "Beatriz Souza", status: "BLOCKED" }),
    ];
    const user = userEvent.setup();
    render(<AceExecutionsTable executions={executions} curators={[]} />);

    await user.selectOptions(screen.getByLabelText("Filtrar por status"), "BLOCKED");

    expect(screen.getByText("Beatriz Souza")).toBeInTheDocument();
    expect(screen.queryByText("Ana Silva")).not.toBeInTheDocument();
  });

  it("cada linha aponta para o detalhe da execução em /admin/ace/[executionId]", () => {
    render(<AceExecutionsTable executions={[buildExecution({ id: "exec-42" })]} curators={[]} />);
    expect(screen.getByRole("link", { name: "Abrir" })).toHaveAttribute("href", "/admin/ace/exec-42");
  });
});
