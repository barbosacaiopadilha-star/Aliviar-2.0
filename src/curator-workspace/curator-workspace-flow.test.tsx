import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CuratorWorkspaceSurface } from "@/components/curador/workspace/CuratorWorkspaceSurface";
import {
  buildCuradoriaContextoView,
  confirmHistoriaRecebida,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";
import { approveReport } from "@/curation-report";
import {
  buildCuratorWorkspaceView,
  createCuratorWorkspaceStack,
  openCuratorWorkspace,
  workspaceAddEvidence,
  workspaceAddMedicalCandidate,
  workspaceSubmitForReview,
} from "@/curator-workspace";
import { curationReportMutationDeps } from "@/curator-workspace/composition/curator-workspace-stack";

const CURATOR_ID = "curator-workspace-1";

function baseContextView(journeyId: string, patientName: string) {
  return {
    journeyId,
    patientName,
    narrativeCheckpoint: "Contando sua história",
    caseTitle: "Jornada de Ana",
    comprehension: "Contexto consolidado.",
    novoContextoDisponivel: true,
    sinalCuradoria: "Novo contexto disponível.",
    casoProntoParaAnalise: true,
    aberturaCuradoria: "Caso pronto para análise.",
    casoEmElaboracao: true,
    sinalElaboracao: "Caso em elaboração.",
    espacoRelatorioPreparado: true,
    organizacao: [{ title: "Observações", items: [{ id: "o-1", label: "Observação", detail: "Dor persistente", sharedAt: "2026-07-22T12:00:00.000Z" }] }],
    historico: [{ id: "h-1", headline: "Contexto compartilhado", occurredAt: "2026-07-22T12:00:00.000Z" }],
    memorySummary: "Histórico compartilhado pelo paciente.",
  };
}

describe("CuratorWorkspaceSurface", () => {
  it("apresenta ambiente operacional, não dashboard", () => {
    render(
      <CuratorWorkspaceSurface
        journeyId="journey-1"
        initialView={{
          reportId: "report-1",
          journeyId: "journey-1",
          caseId: "case-1",
          patientId: "patient-1",
          patientName: "Ana Costa",
          caseTitle: "Jornada de Ana",
          journeyState: "Curadoria",
          reportStatus: "DRAFT",
          statusLabel: "Em elaboração",
          editable: true,
          sharedContextSummary: "Histórico compartilhado.",
          criteriaUsed: ["Compreensão clínica"],
          currentVersion: 1,
          context: baseContextView("journey-1", "Ana Costa"),
          evidences: [],
          medicalCandidates: [],
          curatorNotes: [],
        }}
        onViewChange={() => undefined}
      />,
    );

    expect(screen.getByTestId("curator-workspace")).toBeTruthy();
    expect(screen.getByTestId("workspace-context")).toBeTruthy();
    expect(screen.getByTestId("workspace-add-evidence-form")).toBeTruthy();
    expect(screen.queryByText(/dashboard/i)).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

describe("fluxo Portal → Curadoria → Workspace", () => {
  it("abre relatório e opera via serviços de domínio até revisão", async () => {
    const stack = await createCuratorWorkspaceStack();
    const flow = await runPublicToPortalFlow(stack, {
      sessionId: "curator-ws-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana@example.com",
      journeyTitle: "Jornada de Ana",
    });

    registerPatientInStack(stack, {
      userId: "patient-ws-1",
      email: "ana@example.com",
      patientId: flow.patientId,
      fullName: "Ana Costa",
      preferredName: "Ana",
    });
    await signInPatient(stack, "patient-ws-1");

    await sharePatientContext(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-ws-1",
      observation: "Dor persistente há dois anos.",
    });
    await confirmHistoriaRecebida(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-ws-1",
      patientName: "Ana Costa",
    });
    await iniciarCuradoriaCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-ws-1",
      patientName: "Ana Costa",
    });
    await elaborarRelatorioCaso(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: "patient-ws-1",
      patientName: "Ana Costa",
    });

    const curadoria = await buildCuradoriaContextoView(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
    });
    expect(curadoria.ok).toBe(true);

    const opened = await openCuratorWorkspace(stack, {
      journeyId: flow.journeyId,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const withEvidence = await workspaceAddEvidence(stack, {
      reportId: opened.value.id,
      actorId: CURATOR_ID,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
      evidence: {
        origin: "JourneyMemory",
        description: "Observação clínica compartilhada",
        type: "OBSERVATION",
        confidence: 0.9,
        reference: "mem-obs-1",
      },
    });
    expect(withEvidence.ok).toBe(true);
    if (!withEvidence.ok) return;
    expect(withEvidence.value.evidences).toHaveLength(1);

    const withCandidate = await workspaceAddMedicalCandidate(stack, {
      reportId: opened.value.id,
      actorId: CURATOR_ID,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
      candidate: {
        identification: "dr-neuro-01",
        specialty: "Neurologia",
        justification: "Experiência com quadro relatado.",
        relatedEvidenceIds: [withEvidence.value.evidences[0]!.id],
        priority: 1,
        selectionReasons: [{ criterion: "Adequação clínica", rationale: "Perfil compatível." }],
      },
    });
    expect(withCandidate.ok).toBe(true);
    if (!withCandidate.ok) return;
    expect(withCandidate.value.medicalCandidates).toHaveLength(1);

    const submitted = await workspaceSubmitForReview(stack, {
      reportId: opened.value.id,
      actorId: CURATOR_ID,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    expect(submitted.value.reportStatus).toBe("UNDER_REVIEW");

    const view = await buildCuratorWorkspaceView(stack, {
      report: (await stack.reportRepository.findById(opened.value.id))!,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
    });
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.context.organizacao.length).toBeGreaterThan(0);

    const approved = await approveReport(curationReportMutationDeps(stack), {
      reportId: opened.value.id,
      actorId: CURATOR_ID,
    });
    expect(approved.ok).toBe(true);

    const blocked = await workspaceAddEvidence(stack, {
      reportId: opened.value.id,
      actorId: CURATOR_ID,
      handoffId: flow.handoffId,
      curatorActorId: CURATOR_ID,
      evidence: {
        origin: "Tardia",
        description: "Não deve entrar",
        type: "OTHER",
        confidence: 0.5,
        reference: "x",
      },
    });
    expect(blocked.ok).toBe(false);
  });
});
