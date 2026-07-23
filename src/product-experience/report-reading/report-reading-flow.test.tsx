import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReportReadingSurface } from "@/components/portal/report-reading/ReportReadingSurface";
import {
  confirmReportReading,
  openReportReading,
} from "@/product-experience/report-reading";
import {
  createSystemIntegrationStack,
  runCurationLifecycle,
  curationReportMutationDeps,
  reportDeliveryMutationDeps,
} from "@/system-integration";
import { deliverReport } from "@/curation-report";
import { createDelivery, publishDelivery } from "@/report-delivery";
import {
  confirmHistoriaRecebida,
  elaborarRelatorioCaso,
  iniciarCuradoriaCaso,
  registerPatientInStack,
  runPublicToPortalFlow,
  sharePatientContext,
  signInPatient,
} from "@/vertical-slice";

const CURATOR_ID = "curator-reading-1";
const PATIENT_USER_ID = "patient-reading-1";

async function bootstrapPublishedReport() {
  const stack = await createSystemIntegrationStack();
  const flow = await runPublicToPortalFlow(stack, {
    sessionId: "report-reading-flow",
    patientFullName: "Ana Costa",
    patientPreferredName: "Ana",
    patientEmail: "ana.reading@example.com",
    journeyTitle: "Jornada de Ana",
  });

  registerPatientInStack(stack, {
    userId: PATIENT_USER_ID,
    email: "ana.reading@example.com",
    patientId: flow.patientId,
    fullName: "Ana Costa",
    preferredName: "Ana",
  });
  await signInPatient(stack, PATIENT_USER_ID);

  await sharePatientContext(stack, {
    journeyId: flow.journeyId,
    patientId: flow.patientId,
    actorId: PATIENT_USER_ID,
    observation: "Dor persistente com histórico compartilhado.",
  });
  await confirmHistoriaRecebida(stack, {
    journeyId: flow.journeyId,
    patientId: flow.patientId,
    actorId: PATIENT_USER_ID,
    patientName: "Ana Costa",
  });
  await iniciarCuradoriaCaso(stack, {
    journeyId: flow.journeyId,
    patientId: flow.patientId,
    actorId: PATIENT_USER_ID,
    patientName: "Ana Costa",
  });
  await elaborarRelatorioCaso(stack, {
    journeyId: flow.journeyId,
    patientId: flow.patientId,
    actorId: PATIENT_USER_ID,
    patientName: "Ana Costa",
  });

  const curation = await runCurationLifecycle(stack, {
    journeyId: flow.journeyId,
    handoffId: flow.handoffId,
    curatorActorId: CURATOR_ID,
  });

  const deliveryDeps = reportDeliveryMutationDeps(stack);
  const created = await createDelivery(deliveryDeps, {
    reportId: curation.reportId,
    actorId: CURATOR_ID,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error("delivery create failed");

  const published = await publishDelivery(deliveryDeps, {
    deliveryId: created.value.id,
    actorId: CURATOR_ID,
  });
  expect(published.ok).toBe(true);
  if (!published.ok) throw new Error("delivery publish failed");

  const delivered = await deliverReport(curationReportMutationDeps(stack), {
    reportId: curation.reportId,
    actorId: CURATOR_ID,
  });
  expect(delivered.ok).toBe(true);

  return { stack, flow };
}

describe("ReportReadingSurface", () => {
  it("apresenta critérios, candidatos e confirmação sem dashboard", () => {
    render(
      <ReportReadingSurface
        initialView={{
          journeyId: "journey-1",
          patientName: "Ana Costa",
          journeyState: "Entrega",
          sharedContextSummary: "Contexto consolidado da jornada.",
          memoryHighlights: ["História compartilhada pelo paciente."],
          criteriaUsed: ["Compreensão clínica", "Adequação ao perfil"],
          candidates: [
            {
              id: "cand-1",
              identification: "Dra. Neurologia",
              specialty: "Neurologia",
              justification: "Experiência com o quadro relatado.",
              reasons: [{ criterion: "Adequação clínica", rationale: "Perfil compatível." }],
              priority: 1,
            },
          ],
          deliveryId: "delivery-1",
          publishedAt: "2026-07-22T18:00:00.000Z",
          firstViewedAt: "2026-07-22T18:01:00.000Z",
          readConfirmedAt: null,
          canConfirmReading: true,
          journeyClosed: false,
          portalHref: "/portal",
        }}
        onViewChange={() => undefined}
      />,
    );

    expect(screen.getByTestId("report-reading")).toBeTruthy();
    expect(screen.getByTestId("report-reading-criteria")).toBeTruthy();
    expect(screen.getByTestId("report-reading-candidates")).toBeTruthy();
    expect(screen.getByTestId("report-reading-confirm")).toBeTruthy();
    expect(screen.queryByText(/dashboard/i)).toBeNull();
  });
});

describe("fluxo Portal → Leitura → Confirmação → Jornada encerrada", () => {
  it("abre leitura, confirma via ReportDelivery e encerra jornada", async () => {
    const { stack, flow } = await bootstrapPublishedReport();

    const opened = await openReportReading(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: PATIENT_USER_ID,
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    expect(opened.value.criteriaUsed.length).toBeGreaterThan(0);
    expect(opened.value.candidates.length).toBeGreaterThan(0);
    expect(opened.value.firstViewedAt).toBeTruthy();
    expect(opened.value.canConfirmReading).toBe(true);

    const confirmed = await confirmReportReading(stack, {
      journeyId: flow.journeyId,
      patientId: flow.patientId,
      actorId: PATIENT_USER_ID,
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;

    expect(confirmed.value.readConfirmedAt).toBeTruthy();
    expect(confirmed.value.journeyClosed).toBe(true);
    expect(confirmed.value.journeyState).toBe("Jornada encerrada");

    const journey = await stack.journeyRepository.findById(flow.journeyId);
    expect(journey?.currentStage).toBe("ENCERRADO");

    const accesses = await stack.deliveryAccessRepository.listByDeliveryId(opened.value.deliveryId);
    expect(accesses.map((item) => item.accessType)).toEqual(
      expect.arrayContaining(["FIRST_VIEW", "READ_CONFIRMATION"]),
    );
  });
});
