import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartCaseButton } from "@/components/cases/start-case-button";

const pushMock = vi.fn();
const createCaseActionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/modules/cases/actions", () => ({
  createCaseAction: (...args: unknown[]) => createCaseActionMock(...args),
}));

const STORY_ID = "00000000-0000-4000-8000-000000000101";
const CURATOR_ID = "00000000-0000-4000-8000-000000000201";

describe("abertura operacional de um caso", () => {
  beforeEach(() => {
    cleanup();
    pushMock.mockReset();
    createCaseActionMock.mockReset();
  });

  it("bloqueia o beco sem saída quando não há Curador habilitado", () => {
    render(<StartCaseButton storyId={STORY_ID} curators={[]} />);

    expect(
      screen.queryByRole("button", { name: "Iniciar caso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Habilitar curador na equipe" }),
    ).toHaveAttribute("href", "/admin/equipe");
  });

  it("pré-seleciona o único Curador e abre o caso já atribuído", async () => {
    createCaseActionMock.mockResolvedValue({ success: true, caseId: "case-1" });
    const user = userEvent.setup();

    render(
      <StartCaseButton
        storyId={STORY_ID}
        curators={[{ id: CURATOR_ID, name: "Dra. Helena" }]}
      />,
    );

    expect(screen.getByLabelText("Destino inicial")).toHaveValue(CURATOR_ID);
    await user.click(screen.getByRole("button", { name: "Iniciar caso" }));

    expect(createCaseActionMock).toHaveBeenCalledWith({
      storyId: STORY_ID,
      assignedCuratorId: CURATOR_ID,
    });
    expect(pushMock).toHaveBeenCalledWith("/admin/casos/case-1");
  });

  it("preserva a fila compartilhada quando há mais de um Curador", async () => {
    createCaseActionMock.mockResolvedValue({ success: true, caseId: "case-2" });
    const user = userEvent.setup();

    render(
      <StartCaseButton
        storyId={STORY_ID}
        curators={[
          { id: CURATOR_ID, name: "Dra. Helena" },
          { id: "00000000-0000-4000-8000-000000000202", name: "Dr. André" },
        ]}
      />,
    );

    expect(screen.getByLabelText("Destino inicial")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Iniciar caso" }));

    expect(createCaseActionMock).toHaveBeenCalledWith({
      storyId: STORY_ID,
      assignedCuratorId: undefined,
    });
  });
});
