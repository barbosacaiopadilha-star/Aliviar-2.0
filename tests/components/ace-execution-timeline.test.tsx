import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AceExecutionTimeline } from "@/components/ace/ace-execution-timeline";
import type { AceExecutionEvent } from "@/modules/concierge/types";

afterEach(cleanup);

function buildEvent(overrides: Partial<AceExecutionEvent> = {}): AceExecutionEvent {
  return {
    id: "event-1",
    executionId: "exec-1",
    caseId: "case-1",
    eventType: "STARTED",
    protocolId: null,
    message: "Execução iniciada.",
    metadata: {},
    createdAt: new Date("2026-07-01T10:00:00Z").toISOString(),
    ...overrides,
  };
}

describe("AceExecutionTimeline", () => {
  it("mostra estado vazio quando não há eventos", () => {
    render(<AceExecutionTimeline events={[]} />);
    expect(screen.getByText("Nenhum evento registrado ainda para esta execução.")).toBeInTheDocument();
  });

  it("renderiza a narrativa humana de cada evento em ordem", () => {
    const events = [
      buildEvent({ id: "e1", eventType: "STARTED", message: "Execução iniciada." }),
      buildEvent({ id: "e2", eventType: "PROTOCOL_COMPLETED", protocolId: "P001", message: "P001 concluído." }),
    ];
    render(<AceExecutionTimeline events={events} />);

    expect(screen.getByText("Execução iniciada.")).toBeInTheDocument();
    expect(screen.getByText("P001 concluído.")).toBeInTheDocument();
    expect(screen.getByText("Protocolo concluído")).toBeInTheDocument();
  });

  it("o log estruturado (JSON) fica escondido até o usuário pedir para ver", async () => {
    const events = [buildEvent()];
    const user = userEvent.setup();
    render(<AceExecutionTimeline events={events} />);

    expect(screen.queryByText(/"eventType": "STARTED"/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver log estruturado (JSON)" }));
    expect(screen.getByText(/"eventType": "STARTED"/)).toBeInTheDocument();
  });
});
