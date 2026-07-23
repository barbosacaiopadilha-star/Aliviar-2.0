import { iniciarCuradoriaCaso } from "@/vertical-slice";
import {
  jsonRouteData,
  jsonRouteMessage,
  runPatientPortalRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.curadoria-comecou",
    handler: async (context, { stack, userId, flow }) => {
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
