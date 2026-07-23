import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardPatientDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";
import { iniciarCuradoriaCaso } from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.curadoria-comecou",
    flag: DEMO_MODE_FLAGS.PATIENT_DEMO_MODE,
    guard: guardPatientDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoApiRuntime();

      const patient = await stack.patientRepository.findById(flow.patientId);
      if (!patient) {
        return jsonRouteMessage(context, 404, "Paciente não encontrado.");
      }

      const started = await iniciarCuradoriaCaso(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        patientName: patient.fullName,
      });

      if (!started.ok) {
        return jsonRouteMessage(context, 400, started.error.message);
      }

      return jsonRouteData(context, 200, started.value);
    },
  });
}
