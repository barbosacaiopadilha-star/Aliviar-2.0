import {
  buildCompartilharContextoView,
  confirmHistoriaRecebida,
  sharePatientContext,
} from "@/vertical-slice";
import {
  jsonRouteData,
  jsonRouteMessage,
  runPatientPortalRoute,
} from "@/infrastructure/persistence/run-persistence-route";

export async function GET(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.compartilhar-contexto.get",
    handler: async (context, { stack, userId, flow }) => {
      const patient = await stack.patientRepository.findById(flow.patientId);
      if (!patient) {
        return jsonRouteMessage(context, 404, "Paciente não encontrado.");
      }

      const view = await buildCompartilharContextoView(stack, {
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

export async function POST(request: Request) {
  return runPatientPortalRoute(request, {
    operation: "me.compartilhar-contexto.post",
    handler: async (context, { stack, userId, flow }) => {
      const body = (await request.json()) as {
        observation?: string | null;
        document?: { name: string; where: string; note?: string | null } | null;
        reference?: { label: string; url: string } | null;
      };

      const shared = await sharePatientContext(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        observation: body.observation,
        document: body.document,
        reference: body.reference,
      });

      if (!shared.ok) {
        return jsonRouteMessage(context, 400, shared.error.message);
      }

      const patient = await stack.patientRepository.findById(flow.patientId);
      const confirmed = await confirmHistoriaRecebida(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        patientName: patient?.fullName ?? "Paciente",
      });

      if (!confirmed.ok) {
        return jsonRouteMessage(context, 400, confirmed.error.message);
      }

      const view = await buildCompartilharContextoView(stack, {
        journeyId: flow.journeyId,
        patientId: flow.patientId,
        actorId: userId,
        patientName: patient?.fullName ?? "Paciente",
      });

      if (!view.ok) {
        return jsonRouteMessage(context, 404, view.error.message);
      }

      return jsonRouteData(context, 200, {
        confirmationPath: shared.value.confirmationPath,
        sharedItems: shared.value.sharedItems,
        view: view.value,
      });
    },
  });
}
