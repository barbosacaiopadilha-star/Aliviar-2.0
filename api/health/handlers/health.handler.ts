import { runOperationalHealthChecks } from "@/infrastructure/observability/health-check";
import { coletarMetricasOperacionais } from "@/infrastructure/observability/metrics-collector";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse, successResponse } from "api/shared/http/response";

export async function handleOperationalHealth(): Promise<Response> {
  try {
    const report = await runOperationalHealthChecks();
    const status = report.status === "ok" ? 200 : report.status === "degraded" ? 207 : 503;
    return successResponse(report, status);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}

export async function handleOperationalMetrics(): Promise<Response> {
  try {
    const metricas = await coletarMetricasOperacionais();
    return successResponse(metricas);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
