import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CaseNotesLog } from "@/components/cases/case-notes-log";

const { addCaseNoteActionMock } = vi.hoisted(() => ({ addCaseNoteActionMock: vi.fn() }));

vi.mock("@/modules/cases/actions", () => ({
  addCaseNoteAction: addCaseNoteActionMock,
}));

afterEach(cleanup);

describe("CaseNotesLog (histórico append-only)", () => {
  it("mostra notas anteriores e nunca oferece editá-las", () => {
    render(
      <CaseNotesLog
        caseId="case-1"
        initialNotes={[
          { id: 1, caseId: "case-1", authorId: "u1", authorName: "Ana", body: "Primeira nota", createdAt: new Date().toISOString() },
        ]}
      />,
    );

    expect(screen.getByText("Primeira nota")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("acrescenta uma nota nova sem substituir as anteriores", async () => {
    addCaseNoteActionMock.mockResolvedValue({
      success: true,
      note: { id: 2, caseId: "case-1", authorId: "u1", authorName: "Ana", body: "Nova nota", createdAt: new Date().toISOString() },
    });

    const user = userEvent.setup();
    render(
      <CaseNotesLog
        caseId="case-1"
        initialNotes={[
          { id: 1, caseId: "case-1", authorId: "u1", authorName: "Ana", body: "Primeira nota", createdAt: new Date().toISOString() },
        ]}
      />,
    );

    await user.type(screen.getByLabelText("Nova nota"), "Nova nota");
    await user.click(screen.getByRole("button", { name: "Adicionar nota" }));

    expect(await screen.findByText("Nova nota")).toBeInTheDocument();
    expect(screen.getByText("Primeira nota")).toBeInTheDocument();
  });
});
