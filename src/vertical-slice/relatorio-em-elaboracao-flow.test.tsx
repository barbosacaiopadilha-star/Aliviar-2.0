import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { RelatorioEmElaboracaoSurface } from "@/components/portal/RelatorioEmElaboracaoSurface";
import {
  buildCuradoriaContextoView,
  buildPrimeiroPortalView,
  buildRelatorioEmElaboracaoView,
  confirmHistoriaRecebida,
  createVerticalSliceStack,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

describe("RelatorioEmElaboracaoSurface", () => {
  it("apresenta trabalho cuidadoso em andamento, sem checklist nem progresso", () => {
    render(
      <RelatorioEmElaboracaoSurface
        view={{
          headline: "O relatório está sendo construído",
          narrative: "Estamos analisando cuidadosamente todas as informações compartilhadas.",
          continuation: "Este é um trabalho técnico e cuidadoso.",
          patientName: "Ana Costa",
          journeyState: "Entrega",
          portalHref: "/portal",
          elaborationStartedAt: "2026-07-22T12:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("relatorio-elaboracao-headline")).toHaveTextContent(
      "O relatório está sendo construído",
    );
    expect(screen.getByTestId("relatorio-elaboracao-narrative")).toHaveTextContent(
      "Estamos analisando cuidadosamente",
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/checklist/i)).toBeNull();
    expect(screen.queryByText(/prazo/i)).toBeNull();
    expect(screen.queryByText(/médico/i)).toBeNull();
  });
});

describe("fluxo completo até Relatório em elaboração", () => {
  it("evolui jornada e projeta portal e curadoria a partir das entidades existentes", async () => {
    const stack = await createVerticalSliceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "visitor-report-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-report-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-report-1");

    await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
      observation: "Tenho exames antigos que podem ajudar.",
    });

    await confirmHistoriaRecebida(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
      patientName: "Ana Costa",
    });

    const curadoria = await iniciarCuradoriaCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
      patientName: "Ana Costa",
    });
    expect(curadoria.ok).toBe(true);
    if (!curadoria.ok) return;
    expect(curadoria.value.portalHref).toBe("/portal/relatorio-em-elaboracao");

    const elaboration = await elaborarRelatorioCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
      patientName: "Ana Costa",
    });
    expect(elaboration.ok).toBe(true);
    if (!elaboration.ok) return;
    expect(elaboration.value.narrative).toContain("analisando cuidadosamente");

    const relatorioView = await buildRelatorioEmElaboracaoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
      patientName: "Ana Costa",
    });
    expect(relatorioView.ok).toBe(true);

    const portalView = await buildPrimeiroPortalView(stack, {
      handoffId: flow.handoffId,
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-report-1",
    });
    expect(portalView.ok).toBe(true);
    if (!portalView.ok) return;
    expect(portalView.value.relatorioEmElaboracao).toBe(true);
    expect(portalView.value.trabalhoEmAndamento).toContain("analisando cuidadosamente");
    expect(portalView.value.journeyState).toBe("Entrega");

    const curadoriaView = await buildCuradoriaContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      handoffId: flow.handoffId,
      curatorActorId: "manager-profile-1",
    });
    expect(curadoriaView.ok).toBe(true);
    if (!curadoriaView.ok) return;
    expect(curadoriaView.value.casoEmElaboracao).toBe(true);
    expect(curadoriaView.value.sinalElaboracao).toBe("Caso em elaboração.");
    expect(curadoriaView.value.espacoRelatorioPreparado).toBe(true);
    expect(curadoriaView.value.organizacao.length).toBeGreaterThan(0);
    expect(curadoriaView.value.historico.length).toBeGreaterThan(0);
  });
});
