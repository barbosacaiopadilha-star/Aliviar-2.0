import { describe, expect, it } from "vitest";

import {
  InMemoryDeliveryAccessRepository,
  InMemoryDeliveryRepository,
  InMemoryDeliveryVersionRepository,
  InMemoryReportLookup,
} from "./infrastructure/in-memory-repositories";
import { DeliveryAggregate } from "./model/report-delivery";
import { archiveDelivery } from "./services/archive-delivery";
import { createDelivery } from "./services/create-delivery";
import { publishDelivery } from "./services/publish-delivery";
import { registerFirstView } from "./services/register-first-view";
import { registerReadConfirmation } from "./services/register-read-confirmation";
import { reopenDelivery } from "./services/reopen-delivery";

const REPORT_ID = "report-1";
const JOURNEY_ID = "journey-1";
const PATIENT_ID = "patient-1";
const CURATOR_ID = "curator-1";
const PATIENT_ACTOR_ID = "patient-1";

let tick = 0;

function buildDeps(reportVersion = 3, reportStatus: "APPROVED" | "DRAFT" | "DELIVERED" = "APPROVED") {
  tick += 1;
  return {
    deliveryRepository: new InMemoryDeliveryRepository(),
    versionRepository: new InMemoryDeliveryVersionRepository(),
    accessRepository: new InMemoryDeliveryAccessRepository(),
    reportLookup: new InMemoryReportLookup([
      {
        id: REPORT_ID,
        journeyId: JOURNEY_ID,
        patientId: PATIENT_ID,
        status: reportStatus,
        currentVersion: reportVersion,
      },
    ]),
    ids: { nextId: () => `id-${tick += 1}` },
    clock: { now: () => `2026-07-22T15:00:${String(tick).padStart(2, "0")}.000Z` },
  };
}

async function createPublishedDelivery(deps: ReturnType<typeof buildDeps>) {
  const created = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error("create failed");

  const published = await publishDelivery(deps, {
    deliveryId: created.value.id,
    actorId: CURATOR_ID,
  });
  expect(published.ok).toBe(true);
  if (!published.ok) throw new Error("publish failed");

  return published.value;
}

describe("DeliveryAggregate", () => {
  it("reidrata apenas com relatório, jornada e paciente válidos", () => {
    const aggregate = DeliveryAggregate.create({
      id: "delivery-1",
      reportId: REPORT_ID,
      journeyId: JOURNEY_ID,
      patientId: PATIENT_ID,
      reportVersion: 2,
      actorId: CURATOR_ID,
      occurredAt: "2026-07-22T15:00:00.000Z",
    });

    const snapshot = aggregate.toSnapshot();
    expect(DeliveryAggregate.rehydrate({ ...snapshot, reportId: "" }).ok).toBe(false);
    expect(DeliveryAggregate.rehydrate({ ...snapshot, journeyId: "" }).ok).toBe(false);
    expect(DeliveryAggregate.rehydrate({ ...snapshot, patientId: "" }).ok).toBe(false);
    expect(DeliveryAggregate.rehydrate({ ...snapshot, reportVersion: 0 }).ok).toBe(false);
  });
});

describe("report delivery services", () => {
  it("cria entrega apenas para relatório aprovado", async () => {
    const deps = buildDeps();
    const created = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.status).toBe("PENDING");
    expect(created.value.reportVersion).toBe(3);
    expect(created.value.auditTrail).toHaveLength(1);
    expect(created.value.auditTrail[0]?.action).toBe("DELIVERY_CREATED");
  });

  it("rejeita criação para relatório não aprovado", async () => {
    const deps = buildDeps(3, "DRAFT");
    const invalid = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });

    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.error.code).toBe("DOMAIN_ERROR");
    expect(invalid.error.message).toMatch(/aprovados/i);
  });

  it("impede mais de uma entrega ativa por versão do relatório", async () => {
    const deps = buildDeps();
    const first = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(first.ok).toBe(true);

    const duplicate = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.error.message).toMatch(/entrega ativa/i);
  });

  it("publica entrega e registra disponibilização", async () => {
    const deps = buildDeps();
    const created = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const published = await publishDelivery(deps, {
      deliveryId: created.value.id,
      actorId: CURATOR_ID,
    });

    expect(published.ok).toBe(true);
    if (!published.ok) return;

    expect(published.value.status).toBe("PUBLISHED");
    expect(published.value.publishedAt).toBeTruthy();
    expect(published.value.auditTrail.some((entry) => entry.action === "DELIVERY_PUBLISHED")).toBe(true);

    const versions = await deps.versionRepository.listByDeliveryId(created.value.id);
    expect(versions).toHaveLength(2);
  });

  it("registra primeira visualização com auditoria e histórico de acesso", async () => {
    const deps = buildDeps();
    const delivery = await createPublishedDelivery(deps);

    const viewed = await registerFirstView(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });

    expect(viewed.ok).toBe(true);
    if (!viewed.ok) return;

    expect(viewed.value.delivery.firstViewedAt).toBeTruthy();
    expect(viewed.value.access.accessType).toBe("FIRST_VIEW");

    const accesses = await deps.accessRepository.listByDeliveryId(delivery.id);
    expect(accesses).toHaveLength(1);
    expect(viewed.value.delivery.auditTrail.some((entry) => entry.action === "FIRST_VIEW_REGISTERED")).toBe(
      true,
    );
  });

  it("registra confirmação de leitura após visualização", async () => {
    const deps = buildDeps();
    const delivery = await createPublishedDelivery(deps);

    await registerFirstView(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });

    const confirmed = await registerReadConfirmation(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });

    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;

    expect(confirmed.value.delivery.readConfirmedAt).toBeTruthy();
    expect(confirmed.value.access.accessType).toBe("READ_CONFIRMATION");

    const accesses = await deps.accessRepository.listByDeliveryId(delivery.id);
    expect(accesses).toHaveLength(2);
  });

  it("registra reaberturas com contador e histórico", async () => {
    const deps = buildDeps();
    const delivery = await createPublishedDelivery(deps);

    await registerFirstView(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });

    const reopened = await reopenDelivery(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;
    expect(reopened.value.delivery.reopenCount).toBe(1);

    const reopenedAgain = await reopenDelivery(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(reopenedAgain.ok).toBe(true);
    if (!reopenedAgain.ok) return;
    expect(reopenedAgain.value.delivery.reopenCount).toBe(2);

    const accesses = await deps.accessRepository.listByDeliveryId(delivery.id);
    expect(accesses.filter((item) => item.accessType === "REOPEN")).toHaveLength(2);
  });

  it("permite nova entrega quando versão aprovada do relatório muda", async () => {
    const deps = buildDeps(3);
    const first = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    await archiveDelivery(deps, { deliveryId: first.value.id, actorId: CURATOR_ID });

    deps.reportLookup = new InMemoryReportLookup([
      {
        id: REPORT_ID,
        journeyId: JOURNEY_ID,
        patientId: PATIENT_ID,
        status: "APPROVED",
        currentVersion: 5,
      },
    ]);

    const nextVersion = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(nextVersion.ok).toBe(true);
    if (!nextVersion.ok) return;
    expect(nextVersion.value.reportVersion).toBe(5);
  });

  it("bloqueia tentativas inválidas de acesso e transição", async () => {
    const deps = buildDeps();
    const created = await createDelivery(deps, { reportId: REPORT_ID, actorId: CURATOR_ID });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const viewBeforePublish = await registerFirstView(deps, {
      deliveryId: created.value.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(viewBeforePublish.ok).toBe(false);

    const published = await publishDelivery(deps, {
      deliveryId: created.value.id,
      actorId: CURATOR_ID,
    });
    expect(published.ok).toBe(true);
    if (!published.ok) return;

    const delivery = published.value;

    const confirmWithoutView = await registerReadConfirmation(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(confirmWithoutView.ok).toBe(false);

    const reopenWithoutView = await reopenDelivery(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(reopenWithoutView.ok).toBe(false);

    await registerFirstView(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });

    const duplicateView = await registerFirstView(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(duplicateView.ok).toBe(false);

    await registerReadConfirmation(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });

    const duplicateConfirm = await registerReadConfirmation(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(duplicateConfirm.ok).toBe(false);

    const republish = await publishDelivery(deps, {
      deliveryId: delivery.id,
      actorId: CURATOR_ID,
    });
    expect(republish.ok).toBe(false);

    await archiveDelivery(deps, { deliveryId: delivery.id, actorId: CURATOR_ID });

    const reopenArchived = await reopenDelivery(deps, {
      deliveryId: delivery.id,
      actorId: PATIENT_ACTOR_ID,
    });
    expect(reopenArchived.ok).toBe(false);
  });

  it("mantém histórico de versões append-only", async () => {
    const deps = buildDeps();
    const delivery = await createPublishedDelivery(deps);

    await registerFirstView(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });
    await registerReadConfirmation(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });
    await reopenDelivery(deps, { deliveryId: delivery.id, actorId: PATIENT_ACTOR_ID });

    const versions = await deps.versionRepository.listByDeliveryId(delivery.id);
    expect(versions.length).toBeGreaterThanOrEqual(5);
    expect(versions[0]?.version).toBe(1);
    expect(versions.at(-1)?.version).toBe(versions.length);
  });
});
