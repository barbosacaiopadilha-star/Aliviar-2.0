import { elaborarRelatorioCaso } from "@/vertical-slice";
import {
  jsonRouteData,
  jsonRouteMessage,
  runPatientPortalRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.relatorio-em-elaboracao",
    handler: async (context, { stack, userId, flow }) => {
      const patient = await stack.patientRepository.findById(flow.patientId);
      if (!patient) {
        return jsonRouteMessage(context, 404, "Paciente não encontrado.");
      }

      const elaboration = await elaborarRelatorioCaso(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        patientName: patient.fullName,
      });

      if (!elaboration.ok) {
        return jsonRouteMessage(context, 400, elaboration.error.message);
      }

      return jsonRouteData(context, 200, elaboration.value);
    },
  });
}
