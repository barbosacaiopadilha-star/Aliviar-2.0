import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardPatientDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";
import {
  buildCompartilharContextoView,
  confirmHistoriaRecebida,
  sharePatientContext,
} from "@/vertical-slice";
import { getDemoApiRuntime } from "@/vertical-slice/infrastructure/demo-api-runtime";

export async function GET(request: Request) {
  return runGuardedDemoRoute(request, {
    operation: "me.compartilhar-contexto.get",
    flag: DEMO_MODE_FLAGS.PATIENT_DEMO_MODE,
    guard: guardPatientDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoApiRuntime();

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
  return runGuardedDemoRoute(request, {
    operation: "me.compartilhar-contexto.post",
    flag: DEMO_MODE_FLAGS.PATIENT_DEMO_MODE,
    guard: guardPatientDemoAccess,
    handler: async (context) => {
      const { stack, userId, flow } = await getDemoApiRuntime();

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
