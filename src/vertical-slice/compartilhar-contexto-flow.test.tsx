import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CompartilharContextoSurface } from "@/components/portal/CompartilharContextoSurface";
import {
  buildCompartilharContextoView,
  buildCuradoriaContextoView,
  createVerticalSliceStack,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

describe("CompartilharContextoSurface", () => {
  it("apresenta experiência de compartilhamento, não upload", () => {
    render(
      <CompartilharContextoSurface
        initialView={{
          invitation: "O que mais ajuda a entender sua história?",
          reassurance: "Não precisa ser perfeito.",
          journeyId: "j-1",
          patientName: "Maria Silva",
          organizacao: [],
          historico: [],
          hasSharedBefore: false,
        }}
        onShared={() => undefined}
      />,
    );

    expect(screen.getByTestId("share-context-form")).toBeTruthy();
    expect(screen.getByTestId("share-observation")).toBeTruthy();
    expect(screen.getByText(/não precisa enviar agora/i)).toBeTruthy();
    expect(screen.queryByText(/upload/i)).toBeNull();
    expect(screen.queryByText(/enviar arquivo/i)).toBeNull();
  });
});

describe("fluxo Portal → Compartilhar → JourneyMemory → Curadoria", () => {
  it("atualiza memória e curadoria recebe contexto organizado", async () => {
    const stack = await createVerticalSliceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "visitor-share-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-share-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-share-1");

    const shared = await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-share-1",
      observation: "Tenho exames antigos que podem ajudar.",
      document: {
        name: "Laudo de ressonância",
        where: "E-mail do hospital",
      },
      reference: {
        label: "Artigo sobre minha condição",
        url: "https://example.org/artigo",
      },
    });

    expect(shared.ok).toBe(true);
    if (!shared.ok) return;
    expect(shared.value.acknowledgement).toContain("clareza");

    const portalView = await buildCompartilharContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-share-1",
      patientName: "Ana Costa",
    });
    expect(portalView.ok).toBe(true);
    if (!portalView.ok) return;
    expect(portalView.value.hasSharedBefore).toBe(true);
    expect(portalView.value.organizacao.length).toBeGreaterThanOrEqual(2);
    expect(portalView.value.historico.length).toBeGreaterThan(0);

    const curadoriaView = await buildCuradoriaContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      handoffId: flow.handoffId,
      curatorActorId: "manager-profile-1",
    });
    expect(curadoriaView.ok).toBe(true);
    if (!curadoriaView.ok) return;

    expect(curadoriaView.value.comprehension).toContain("compreender melhor");
    expect(curadoriaView.value.organizacao.some((g) => g.title === "Observações")).toBe(true);
    expect(curadoriaView.value.organizacao.some((g) => g.title === "Documentos")).toBe(true);
    expect(curadoriaView.value.memorySummary.length).toBeGreaterThan(0);
  });
});
