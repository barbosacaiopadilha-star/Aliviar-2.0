import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FinalCuradoriaDeliveryPanel } from "@/components/ace/final-curadoria-delivery-panel";
import type { FinalCuradoriaDeliveryRecord } from "@/modules/concierge/types";

const { deliverFinalCuradoriaActionMock } = vi.hoisted(() => ({
  deliverFinalCuradoriaActionMock: vi.fn(),
}));

vi.mock("@/modules/concierge/delivery-actions", () => ({
  deliverFinalCuradoriaAction: deliverFinalCuradoriaActionMock,
}));

afterEach(cleanup);

beforeEach(() => {
  deliverFinalCuradoriaActionMock.mockReset();
  vi.stubGlobal("location", { ...window.location, reload: vi.fn() });
});

function buildDelivery(): FinalCuradoriaDeliveryRecord {
  return {
    id: "delivery-1",
    caseId: "case-1",
    patientProfileId: "patient-1",
    humanReviewResultId: "review-1",
    validatedBy: "user-1",
    validatedByName: "Dra. Revisora",
    validatedAt: new Date("2026-07-12T10:00:00Z").toISOString(),
    deliveredBy: "user-1",
    deliveredByName: "Dra. Revisora",
    deliveredAt: new Date("2026-07-12T11:00:00Z").toISOString(),
    generatedAt: new Date("2026-07-12T11:00:00Z").toISOString(),
    decisionSummary: "x",
    clientContextSummary: "x",
    providerPresentations: [],
    comparisonSummary: "x",
    relevantLimitations: [],
    relevantMissingInformation: [],
    nextSteps: [],
    methodExplanation: "x",
    disclaimer: "x",
    methodVersion: "ACE-0.1",
    version: 1,
    createdAt: new Date("2026-07-12T11:00:00Z").toISOString(),
  };
}

describe("FinalCuradoriaDeliveryPanel", () => {
  it("quando já entregue, mostra data e responsável, sem oferecer o botão de entregar de novo", () => {
    render(<FinalCuradoriaDeliveryPanel caseId="case-1" canDeliver={false} delivery={buildDelivery()} />);
    expect(screen.getByText(/Dra\. Revisora/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entregar Curadoria ao paciente" })).not.toBeInTheDocument();
  });

  it("quando não há decisão validada, explica e não oferece o botão", () => {
    render(<FinalCuradoriaDeliveryPanel caseId="case-1" canDeliver={false} delivery={null} />);
    expect(screen.getByText(/Ainda não há uma decisão de revisão validada/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("quando pode entregar, oferece o botão e recarrega a página em caso de sucesso", async () => {
    deliverFinalCuradoriaActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<FinalCuradoriaDeliveryPanel caseId="case-42" canDeliver delivery={null} />);

    await user.click(screen.getByRole("button", { name: "Entregar Curadoria ao paciente" }));

    expect(deliverFinalCuradoriaActionMock).toHaveBeenCalledWith("case-42");
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("em caso de erro, mostra a mensagem sem recarregar", async () => {
    deliverFinalCuradoriaActionMock.mockResolvedValue({ success: false, error: "Este caso já foi entregue." });
    const user = userEvent.setup();
    render(<FinalCuradoriaDeliveryPanel caseId="case-1" canDeliver delivery={null} />);

    await user.click(screen.getByRole("button", { name: "Entregar Curadoria ao paciente" }));

    expect(await screen.findByText("Este caso já foi entregue.")).toBeInTheDocument();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
