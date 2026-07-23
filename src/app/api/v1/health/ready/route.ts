import { runOperationalHealthChecks } from "@/infrastructure/observability/health-check";
import { createApiRequestContext, withRequestContextHeaders } from "@/lib/production/api-request-context";
import { validateProductionConfig } from "@/lib/production/production-config";

export async function GET(request: Request) {
  const context = createApiRequestContext(request);
  const config = validateProductionConfig();

  if (!config.valid) {
    return withRequestContextHeaders(
      Response.json(
        {
          status: "not_ready",
          timestamp: new Date().toISOString(),
          missingRequired: config.missingRequired,
        },
        { status: 503 },
      ),
      context,
    );
  }

  try {
    const report = await runOperationalHealthChecks();
    const ready = report.status !== "down";
    const status = ready ? 200 : 503;

    return withRequestContextHeaders(
      Response.json(
        {
          status: ready ? "ready" : "not_ready",
          timestamp: new Date().toISOString(),
          health: report.status,
          summary: report.summary,
        },
        { status },
      ),
      context,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "readiness_check_failed";
    return withRequestContextHeaders(
      Response.json(
        {
          status: "not_ready",
          timestamp: new Date().toISOString(),
          error: message,
        },
        { status: 503 },
      ),
      context,
    );
  }
}
