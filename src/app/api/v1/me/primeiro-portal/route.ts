import { buildPrimeiroPortalView } from "@/vertical-slice";
import {
  jsonRouteData,
  jsonRouteMessage,
  runPatientPortalRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.primeiro-portal",
    handler: async (context, { stack, userId, flow }) => {
      const view = await buildPrimeiroPortalView(stack, {
        handoffId: flow.handoffId,
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
      });

      if (!view.ok) {
        return jsonRouteMessage(context, 404, view.error.message);
      }

      return jsonRouteData(context, 200, view.value);
    },
  });
}
