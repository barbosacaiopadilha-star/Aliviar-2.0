import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardPatientDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";
import { buildHistoriaRecebidaView } from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.historia-recebida",
    flag: DEMO_MODE_FLAGS.PATIENT_DEMO_MODE,
    guard: guardPatientDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoApiRuntime();

      const patient = await stack.patientRepository.findById(flow.patientId);
      if (!patient) {
        return jsonRouteMessage(context, 404, "Paciente não encontrado.");
      }

      const view = await buildHistoriaRecebidaView(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        patientName: patient.fullName,
      });

      if (!view.ok) {
        return jsonRouteMessage(context, 404, view.error.message);
      }

      return jsonRouteData(context, 200, view.value);
    },
  });
}
