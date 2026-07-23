import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CuradoriaComecouSurface } from "@/components/portal/CuradoriaComecouSurface";
import {
  buildCuradoriaComecouView,
  buildCuradoriaContextoView,
  buildPrimeiroPortalView,
  confirmHistoriaRecebida,
  createVerticalSliceStack,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

describe("CuradoriaComecouSurface", () => {
  it("apresenta evolução da jornada, não rastreador nem progresso", () => {
    render(
      <CuradoriaComecouSurface
        view={{
          headline: "A curadoria começou",
          narrative: "Seu caso agora está sendo analisado.",
          continuation: "Estamos reunindo tudo que você compartilhou.",
          patientName: "Ana Costa",
          journeyState: "Curadoria",
          portalHref: "/portal",
          startedAt: "2026-07-22T12:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("curadoria-comecou-headline")).toHaveTextContent("A curadoria começou");
    expect(screen.getByTestId("curadoria-comecou-narrative")).toHaveTextContent(
      "Seu caso agora está sendo analisado.",
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/prazo/i)).toBeNull();
    expect(screen.queryByText(/previsão/i)).toBeNull();
  });
});

describe("fluxo completo até Curadoria começou", () => {
  it("evolui jornada e projeta portal e curadoria a partir das entidades existentes", async () => {
    const stack = await createVerticalSliceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "visitor-curation-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-curation-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-curation-1");

    const shared = await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-curation-1",
      observation: "Tenho exames antigos que podem ajudar.",
      document: { name: "Laudo", where: "E-mail do hospital" },
    });
    expect(shared.ok).toBe(true);
    if (!shared.ok) return;

    const confirmed = await confirmHistoriaRecebida(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-curation-1",
      patientName: "Ana Costa",
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.value.portalHref).toBe("/portal/curadoria-comecou");

    const started = await iniciarCuradoriaCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-curation-1",
      patientName: "Ana Costa",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.narrative).toBe("Seu caso agora está sendo analisado.");

    const curadoriaComecouView = await buildCuradoriaComecouView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-curation-1",
      patientName: "Ana Costa",
    });
    expect(curadoriaComecouView.ok).toBe(true);

    const portalView = await buildPrimeiroPortalView(stack, {
      handoffId: flow.handoffId,
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-curation-1",
    });
    expect(portalView.ok).toBe(true);
    if (!portalView.ok) return;
    expect(portalView.value.curadoriaIniciada).toBe(true);
    expect(portalView.value.journeyEvolution).toBe("Seu caso agora está sendo analisado.");
    expect(portalView.value.journeyState).toBe("Curadoria");

    const curadoriaView = await buildCuradoriaContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      handoffId: flow.handoffId,
      curatorActorId: "manager-profile-1",
    });
    expect(curadoriaView.ok).toBe(true);
    if (!curadoriaView.ok) return;
    expect(curadoriaView.value.casoProntoParaAnalise).toBe(true);
    expect(curadoriaView.value.aberturaCuradoria).toBe("Caso pronto para análise.");
    expect(curadoriaView.value.organizacao.length).toBeGreaterThan(0);
    expect(curadoriaView.value.historico.length).toBeGreaterThan(0);
  });
});
