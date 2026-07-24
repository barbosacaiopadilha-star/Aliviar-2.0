import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AceArtifactsList } from "@/components/cases/ace-artifacts-list";
import type { AceArtifact } from "@/modules/concierge/types";

afterEach(cleanup);

function buildArtifact(overrides: Partial<AceArtifact> = {}): AceArtifact {
  return {
    id: "artifact-1",
    caseId: "case-1",
    executionId: "exec-1",
    artifactType: "Narrative",
    version: 1,
    protocolId: "P001",
    protocolVersion: "ACE-0.1",
    methodVersion: "ACE-0.1",
    createdBy: "user-1",
    createdAt: new Date("2026-07-01T10:00:00Z").toISOString(),
    supersedes: null,
    validationStatus: "valid",
    payload: { text: "Texto original.", closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true } },
    ...overrides,
  };
}

describe("AceArtifactsList", () => {
  it("mostra estado vazio quando não há artefatos", () => {
    render(<AceArtifactsList artifacts={[]} />);
    expect(screen.getByText("Nenhum artefato do ACE ainda.")).toBeInTheDocument();
  });

  it("mostra só a versão mais recente de cada tipo por padrão, colapsado", () => {
    render(<AceArtifactsList artifacts={[buildArtifact()]} />);
    expect(screen.getByText("História organizada")).toBeInTheDocument();
    expect(screen.queryByText(/"text": "Texto original."/)).not.toBeInTheDocument();
  });

  it("expandir revela o payload completo em JSON", async () => {
    const user = userEvent.setup();
    render(<AceArtifactsList artifacts={[buildArtifact()]} />);

    await user.click(screen.getByRole("button", { name: /História organizada/ }));
    expect(screen.getByText(/"text": "Texto original."/)).toBeInTheDocument();
  });

  it("com mais de uma versão, expandir oferece comparação e mostra a diferença", async () => {
    const closingQuestionsAnswered = { historia: true, decisao: true, objetivo: true };
    const v1 = buildArtifact({
      id: "artifact-1",
      version: 1,
      payload: { text: "Primeira versão.", closingQuestionsAnswered },
      createdAt: new Date("2026-07-01T10:00:00Z").toISOString(),
    });
    const v2 = buildArtifact({
      id: "artifact-2",
      version: 2,
      payload: { text: "Segunda versão.", closingQuestionsAnswered },
      createdAt: new Date("2026-07-01T11:00:00Z").toISOString(),
      supersedes: "artifact-1",
    });

    const user = userEvent.setup();
    render(<AceArtifactsList artifacts={[v1, v2]} />);

    expect(screen.getByText("2 versões")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /História organizada/ }));
    expect(screen.getByText("Comparar versões")).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText('antes: "Primeira versão."')).toBeInTheDocument();
    expect(screen.getByText('depois: "Segunda versão."')).toBeInTheDocument();
  });

  it("uma única versão não oferece comparação", async () => {
    const user = userEvent.setup();
    render(<AceArtifactsList artifacts={[buildArtifact()]} />);

    await user.click(screen.getByRole("button", { name: /História organizada/ }));
    expect(screen.queryByText("Comparar versões")).not.toBeInTheDocument();
  });
});
