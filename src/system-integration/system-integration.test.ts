import { describe, expect, it } from "vitest";

import {
  PlatformFacade,
  buildPlatformJourneyProjection,
  createSystemIntegrationStack,
  runFullPlatformFlow,
} from "@/system-integration";

const CURATOR_ID = "curator-integration-1";
const PATIENT_USER_ID = "patient-integration-1";

describe("integração da plataforma", () => {
  it("projeta estados compostos ao longo do fluxo", async () => {
    const stack = await createSystemIntegrationStack();
    const facade = new PlatformFacade(stack);

    const result = await facade.runFullLifecycle({
      sessionId: "integration-session-1",
      patientFullName: "Ana Costa",
      patientPreferredName: "Ana",
      patientEmail: "ana.integration@example.com",
      journeyTitle: "Jornada integrada de Ana",
      patientUserId: PATIENT_USER_ID,
      curatorActorId: CURATOR_ID,
    });

    expect(result.finalProjection.journeyClosed).toBe(true);
    expect(result.finalProjection.journeyStage).toBe("ENCERRADO");
    expect(result.finalProjection.historiaRecebida).toBe(true);
    expect(result.finalProjection.curadoriaIniciada).toBe(true);
    expect(result.finalProjection.relatorioEmElaboracao).toBe(true);
    expect(result.finalProjection.reportStatus).toBe("DELIVERED");
    expect(result.finalProjection.processStatus).toBe("COMPLETED");
    expect(result.finalProjection.deliveryStatus).toBe("PUBLISHED");
    expect(result.finalProjection.deliveryReadConfirmed).toBe(true);
    expect(result.finalProjection.memoryEventCount).toBeGreaterThan(0);
    expect(result.finalProjection.kernelEventCount).toBeGreaterThan(0);
  });

  it("percorre fluxo completo da landing ao encerramento da jornada", async () => {
    const stack = await createSystemIntegrationStack();
    const result = await runFullPlatformFlow(stack, {
      sessionId: "integration-session-2",
      patientFullName: "Bruno Lima",
      patientPreferredName: "Bruno",
      patientEmail: "bruno.integration@example.com",
      journeyTitle: "Jornada integrada de Bruno",
      patientUserId: "patient-integration-2",
      curatorActorId: CURATOR_ID,
    });

    expect(result.handoffId).toBeTruthy();
    expect(result.journeyId).toBeTruthy();
    expect(result.reportId).toBeTruthy();
    expect(result.processId).toBeTruthy();
    expect(result.deliveryId).toBeTruthy();

    const report = await stack.reportRepository.findById(result.reportId);
    expect(report?.status).toBe("DELIVERED");

    const process = await stack.processRepository.findById(result.processId);
    expect(process?.status).toBe("COMPLETED");
    expect(process?.auditTrail.length).toBeGreaterThan(0);

    const delivery = await stack.deliveryRepository.findById(result.deliveryId);
    expect(delivery?.status).toBe("PUBLISHED");
    expect(delivery?.readConfirmedAt).toBeTruthy();

    const accesses = await stack.deliveryAccessRepository.listByDeliveryId(result.deliveryId);
    expect(accesses.map((item) => item.accessType)).toEqual(
      expect.arrayContaining(["FIRST_VIEW", "READ_CONFIRMATION"]),
    );

    const research = await stack.researchRepository.listByProcessId(result.processId);
    expect(research.length).toBeGreaterThan(0);

    const journey = await stack.journeyRepository.findById(result.journeyId);
    expect(journey?.currentStage).toBe("ENCERRADO");
    expect(journey?.closedAt).toBeTruthy();
  });

  it("valida projeção em marcos intermediários sem duplicar regras de domínio", async () => {
    const stack = await createSystemIntegrationStack();
    const bootstrapped = await runFullPlatformFlow(stack, {
      sessionId: "integration-session-3",
      patientFullName: "Carla Dias",
      patientPreferredName: "Carla",
      patientEmail: "carla.integration@example.com",
      journeyTitle: "Jornada integrada de Carla",
      patientUserId: "patient-integration-3",
      curatorActorId: CURATOR_ID,
    });

    const projection = await buildPlatformJourneyProjection(stack, {
      journeyId: bootstrapped.journeyId,
      patientId: bootstrapped.patientId,
      actorId: "patient-integration-3",
    });

    expect(projection.reportId).toBe(bootstrapped.reportId);
    expect(projection.processId).toBe(bootstrapped.processId);
    expect(projection.deliveryId).toBe(bootstrapped.deliveryId);
    expect(projection.deliveryPublished).toBe(true);
  });
});
