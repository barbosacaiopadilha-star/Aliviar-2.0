import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardReportDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";
import {
  confirmReportReading,
  getDemoReportReadingRuntime,
  openReportReading,
} from "@/product-experience/report-reading";

export async function GET(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.relatorio-leitura.get",
    flag: DEMO_MODE_FLAGS.REPORT_DEMO_MODE,
    guard: guardReportDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoReportReadingRuntime();

      const opened = await openReportReading(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
      });

      if (!opened.ok) {
        const status = opened.error.code === "UNAVAILABLE" ? 409 : 404;
        return jsonRouteMessage(context, status, opened.error.message);
      }

      return jsonRouteData(context, 200, opened.value);
    },
  });
}

export async function POST(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.relatorio-leitura.post",
    flag: DEMO_MODE_FLAGS.REPORT_DEMO_MODE,
    guard: guardReportDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoReportReadingRuntime();

      const confirmed = await confirmReportReading(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
      });

      if (!confirmed.ok) {
        const status = confirmed.error.code === "UNAVAILABLE" ? 409 : 400;
        return jsonRouteMessage(context, status, confirmed.error.message);
      }

      return jsonRouteData(context, 200, confirmed.value);
    },
  });
}
