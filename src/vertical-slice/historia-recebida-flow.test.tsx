import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { HistoriaRecebidaSurface } from "@/components/portal/HistoriaRecebidaSurface";
import {
  buildCuradoriaContextoView,
  buildHistoriaRecebidaView,
  buildPrimeiroPortalView,
  confirmHistoriaRecebida,
  createVerticalSliceStack,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

describe("HistoriaRecebidaSurface", () => {
  it("apresenta experiência narrativa, não tela de sucesso", () => {
    render(
      <HistoriaRecebidaSurface
        view={{
          headline: "Nós recebemos sua história",
          narrative: "Agora conseguimos compreender melhor a sua história.",
          continuation: "Vamos cuidar do que você trouxe.",
          patientName: "Ana Costa",
          journeyState: "Compartilhando sua história",
          portalHref: "/portal",
          receivedAt: "2026-07-22T12:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("historia-recebida-headline")).toHaveTextContent("Nós recebemos sua história");
    expect(screen.getByTestId("historia-recebida-narrative")).toHaveTextContent(
      "Agora conseguimos compreender melhor a sua história.",
    );
    expect(screen.queryByText(/upload/i)).toBeNull();
    expect(screen.queryByText(/concluído/i)).toBeNull();
    expect(screen.queryByText(/arquivo recebido/i)).toBeNull();
    expect(screen.queryByText(/operação realizada/i)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("fluxo Portal → Compartilhar → JourneyMemory → Confirmação → Curadoria", () => {
  it("registra recebimento humano e prepara curadoria", async () => {
    const stack = await createVerticalSliceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "visitor-confirm-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-confirm-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-confirm-1");

    const shared = await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-confirm-1",
      observation: "Tenho exames antigos que podem ajudar.",
    });
    expect(shared.ok).toBe(true);
    if (!shared.ok) return;
    expect(shared.value.confirmationPath).toBe("/portal/recebemos-sua-historia");

    const confirmed = await confirmHistoriaRecebida(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-confirm-1",
      patientName: "Ana Costa",
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.value.narrative).toContain("compreender melhor");

    const historiaView = await buildHistoriaRecebidaView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-confirm-1",
      patientName: "Ana Costa",
    });
    expect(historiaView.ok).toBe(true);
    if (!historiaView.ok) return;
    expect(historiaView.value.headline).toBe("Nós recebemos sua história");

    const portalView = await buildPrimeiroPortalView(stack, {
      handoffId: flow.handoffId,
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-confirm-1",
    });
    expect(portalView.ok).toBe(true);
    if (!portalView.ok) return;
    expect(portalView.value.storyReceived).toBe(true);
    expect(portalView.value.comprehension).toContain("compreender melhor");
    expect(portalView.value.journeyState).toBe("Compartilhando sua história");

    const curadoriaView = await buildCuradoriaContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      handoffId: flow.handoffId,
      curatorActorId: "manager-profile-1",
    });
    expect(curadoriaView.ok).toBe(true);
    if (!curadoriaView.ok) return;
    expect(curadoriaView.value.novoContextoDisponivel).toBe(true);
    expect(curadoriaView.value.sinalCuradoria).toBe("Novo contexto disponível.");
    expect(curadoriaView.value.comprehension).toContain("compreender melhor");
  });
});
