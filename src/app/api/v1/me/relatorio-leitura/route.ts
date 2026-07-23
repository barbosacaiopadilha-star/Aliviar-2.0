import { confirmReportReading, openReportReading } from "@/product-experience/report-reading";
import {
  jsonRouteData,
  jsonRouteMessage,
  runReportReadingRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runReportReadingRoute(request, {
    operation: "me.relatorio-leitura.get",
    handler: async (context, { stack, userId, flow }) => {
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
  return runReportReadingRoute(request, {
    operation: "me.relatorio-leitura.post",
    handler: async (context, { stack, userId, flow }) => {
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
