import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardPatientDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";
import { buildPrimeiroPortalView } from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.primeiro-portal",
    flag: DEMO_MODE_FLAGS.PATIENT_DEMO_MODE,
    guard: guardPatientDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoApiRuntime();

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
