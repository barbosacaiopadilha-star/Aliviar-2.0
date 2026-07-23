import { buildHistoriaRecebidaView } from "@/vertical-slice";
import {
  jsonRouteData,
  jsonRouteMessage,
  runPatientPortalRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.historia-recebida",
    handler: async (context, { stack, userId, flow }) => {
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
