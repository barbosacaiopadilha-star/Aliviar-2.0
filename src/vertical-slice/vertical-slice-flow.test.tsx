import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PrimeiroPortalSurface } from "@/components/portal/PrimeiroPortalSurface";
import {
  buildPrimeiroPortalView,
  createVerticalSliceStack,
  registerPatientInStack,
  runPublicToPortalFlow,
  signInPatient,
} from "@/vertical-slice";

describe("PrimeiroPortalSurface", () => {
  it("mostra apenas saudação, nome, estado, checkpoint e próxima ação", () => {
    render(
      <PrimeiroPortalSurface
        view={{
          greeting: "Olá, Maria. Continuamos de onde paramos.",
          patientName: "Maria Silva",
          journeyState: "Cadastro",
          narrativeCheckpoint: "Contando sua história",
          nextAction: "1 evento(s) na linha do tempo",
          storyReceived: false,
          comprehension: null,
          curadoriaIniciada: false,
          journeyEvolution: null,
          relatorioEmElaboracao: false,
          trabalhoEmAndamento: null,
        }}
      />,
    );

    expect(screen.getByTestId("portal-greeting")).toHaveTextContent("Continuamos de onde paramos");
    expect(screen.getByTestId("portal-patient-name")).toHaveTextContent("Maria Silva");
    expect(screen.getByTestId("portal-journey-state")).toHaveTextContent("Cadastro");
    expect(screen.getByTestId("portal-narrative-checkpoint")).toHaveTextContent("Contando sua história");
    expect(screen.getByTestId("portal-next-action")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

describe("fluxo Landing → Conversa → Handoff → Portal", () => {
  it("projeta a primeira tela autenticada a partir dos cinco pacotes", async () => {
    const stack = await createVerticalSliceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "visitor-flow-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-user-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-user-1");

    const view = await buildPrimeiroPortalView(stack, {
      handoffId: flow.handoffId,
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-user-1",
    });

    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.greeting).toContain("Ana");
    expect(view.value.narrativeCheckpoint).toBe("Contando sua história");
    expect(view.value.journeyState).toBe("Cadastro");
    expect(view.value.nextAction.length).toBeGreaterThan(0);
  });
});
