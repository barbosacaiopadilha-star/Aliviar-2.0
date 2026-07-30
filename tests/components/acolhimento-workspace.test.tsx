import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AcolhimentoWorkspace } from "@/components/curadoria/acolhimento-workspace";

const action = vi.hoisted(() => vi.fn(async () => ({ success: true as const })));
vi.mock("@/modules/curadoria/actions", () => ({ registerAcolhimentoAction: action }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  action.mockClear();
});

function renderWs(ctx = false, docs = false) {
  return render(
    <AcolhimentoWorkspace caseId="11111111-1111-1111-1111-111111111111" contextReviewed={ctx} documentsReviewed={docs} nextPhaseHref="/coa/curadoria/casos/x/historia" />,
  );
}

describe("AcolhimentoWorkspace — Fase 1 resolvível", () => {
  it("oferece as duas revisões e só habilita registrar quando algo mudou", async () => {
    const user = userEvent.setup();
    renderWs();
    const registrar = screen.getByRole("button", { name: "Registrar revisão" });
    expect(registrar).toBeDisabled();
    await user.click(screen.getByLabelText("Revisei o que já se sabe sobre o paciente"));
    expect(registrar).toBeEnabled();
    await user.click(registrar);
    expect(action).toHaveBeenCalledWith({
      caseId: "11111111-1111-1111-1111-111111111111",
      contextReviewed: true,
      documentsReviewed: false,
    });
  });

  it("revisão já registrada nunca é desmarcável — o Acolhimento é acumulativo", () => {
    renderWs(true, false);
    expect(screen.getByLabelText("Revisei o que já se sabe sobre o paciente")).toBeDisabled();
  });

  it("com as duas revisões, o próximo passo aparece e o botão de registrar sai", () => {
    renderWs(true, true);
    expect(screen.queryByRole("button", { name: /Registrar/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Prosseguir para a História/ })).toHaveAttribute(
      "href",
      "/coa/curadoria/casos/x/historia",
    );
  });
});
