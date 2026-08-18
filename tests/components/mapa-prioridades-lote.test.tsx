import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapaPrioridadesPanel } from "@/components/curadoria/mesa/mapa-prioridades-panel";

const saveBatchMock = vi.fn();

vi.mock("@/modules/curadoria/mapa-prioridades-actions", () => ({
  savePriorityImportancesAction: (...args: unknown[]) => saveBatchMock(...args),
}));

const CASE_ID = "00000000-0000-4000-8000-000000000301";

describe("Mapa de Prioridades em lote", () => {
  beforeEach(() => {
    cleanup();
    saveBatchMock.mockReset();
    saveBatchMock.mockResolvedValue({ success: true });
  });

  it("reúne escolhas independentes em uma única gravação", async () => {
    const user = userEvent.setup();
    render(
      <MapaPrioridadesPanel
        caseId={CASE_ID}
        completion={{
          total: 2,
          completed: 0,
          pending: 2,
          pendingCodes: ["ACESSO_A", "ACESSO_B"],
          status: "NOT_STARTED",
        }}
        groups={[
          {
            group: "VIABILIDADE",
            label: "Viabilidade de acesso",
            entries: [
              {
                subcriterion: {
                  code: "ACESSO_A",
                  group: "VIABILIDADE",
                  name: "Primeiro aspecto",
                  description: "Descrição A",
                  displayOrder: 1,
                  active: true,
                },
                importance: null,
              },
              {
                subcriterion: {
                  code: "ACESSO_B",
                  group: "VIABILIDADE",
                  name: "Segundo aspecto",
                  description: "Descrição B",
                  displayOrder: 2,
                  active: true,
                },
                importance: null,
              },
            ],
          },
        ]}
      />,
    );

    const muitoImportante = screen.getAllByRole("radio", {
      name: "Muito importante",
    });
    const importante = screen.getAllByRole("radio", { name: "Importante" });
    await user.click(muitoImportante[0]!);
    await user.click(importante[1]!);
    await user.click(
      screen.getByRole("button", { name: "Salvar 2 alterações" }),
    );

    expect(saveBatchMock).toHaveBeenCalledTimes(1);
    expect(saveBatchMock).toHaveBeenCalledWith({
      caseId: CASE_ID,
      entries: [
        { subcriterionCode: "ACESSO_A", importance: "MUITO_IMPORTANTE" },
        { subcriterionCode: "ACESSO_B", importance: "IMPORTANTE" },
      ],
    });
    expect(
      screen.getByText("Mapa salvo em uma única gravação."),
    ).toBeInTheDocument();
  });
});
