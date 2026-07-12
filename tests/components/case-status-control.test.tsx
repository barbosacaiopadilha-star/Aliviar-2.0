import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CaseStatusControl } from "@/components/cases/case-status-control";

const { changeCaseStatusActionMock } = vi.hoisted(() => ({
  changeCaseStatusActionMock: vi.fn(),
}));

vi.mock("@/modules/cases/actions", () => ({
  changeCaseStatusAction: changeCaseStatusActionMock,
}));

afterEach(cleanup);

describe("CaseStatusControl", () => {
  it("só oferece as transições válidas a partir do estado atual", () => {
    render(<CaseStatusControl caseId="case-1" currentStatus="NEW" />);

    const select = screen.getByLabelText("Novo status") as HTMLSelectElement;
    const values = Array.from(select.options).map((option) => option.value);

    expect(values).toContain("IN_REVIEW");
    expect(values).toContain("CANCELLED");
    expect(values).not.toContain("DELIVERED");
  });

  it("não oferece nenhuma transição a partir de um estado terminal", () => {
    render(<CaseStatusControl caseId="case-1" currentStatus="CLOSED" />);
    expect(screen.queryByLabelText("Novo status")).not.toBeInTheDocument();
    expect(screen.getByText(/status final/)).toBeInTheDocument();
  });

  it("chama a action ao confirmar a mudança de status", async () => {
    changeCaseStatusActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<CaseStatusControl caseId="case-1" currentStatus="NEW" />);

    await user.selectOptions(screen.getByLabelText("Novo status"), "IN_REVIEW");
    await user.click(screen.getByRole("button", { name: "Mudar status" }));

    expect(changeCaseStatusActionMock).toHaveBeenCalledWith({ caseId: "case-1", nextStatus: "IN_REVIEW" });
    expect(await screen.findByText(/Em revisão/)).toBeInTheDocument();
  });
});
