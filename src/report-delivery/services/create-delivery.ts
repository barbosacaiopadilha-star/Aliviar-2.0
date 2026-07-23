import type { ReportDeliverySnapshot } from "../model/report-delivery";
import { DeliveryAggregate } from "../model/report-delivery";
import type { ReportDeliveryMutationDependencies, ReportDeliveryServiceResult } from "./service-helpers";
import { persistDeliveryAggregate } from "./service-helpers";

export interface CreateDeliveryInput {
  reportId: string;
  actorId: string;
}

export async function createDelivery(
  deps: ReportDeliveryMutationDependencies,
  input: CreateDeliveryInput,
): Promise<ReportDeliveryServiceResult<ReportDeliverySnapshot>> {
  const report = await deps.reportLookup.findById(input.reportId);
  if (!report) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Relatório não encontrado." } };
  }

  if (report.status !== "APPROVED") {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Apenas relatórios aprovados podem ser entregues." },
    };
  }

  const existing = await deps.deliveryRepository.findActiveByReportAndVersion(
    input.reportId,
    report.currentVersion,
  );
  if (existing) {
    return {
      ok: false,
      error: {
        code: "DOMAIN_ERROR",
        message: "Já existe entrega ativa para esta versão do relatório.",
      },
    };
  }

  const occurredAt = deps.clock.now();
  const aggregate = DeliveryAggregate.create({
    id: deps.ids.nextId(),
    reportId: report.id,
    journeyId: report.journeyId,
    patientId: report.patientId,
    reportVersion: report.currentVersion,
    actorId: input.actorId,
    occurredAt,
  });

  return persistDeliveryAggregate(deps, aggregate);
}
