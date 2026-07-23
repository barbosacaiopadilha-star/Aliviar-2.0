import { EVIDENCE_TYPES, type EvidenceType } from "@/curation-report";
import {
  buildCuratorWorkspaceView,
  getDemoCuratorWorkspaceRuntime,
  openCuratorWorkspace,
  workspaceAddEvidence,
  workspaceAddMedicalCandidate,
  workspaceAddCuratorNote,
  workspaceSubmitForReview,
} from "@/curator-workspace";
import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import {
  guardCuratorDemoAccess,
  jsonRouteData,
  jsonRouteMessage,
  runGuardedDemoRoute,
} from "@/lib/production/guard-demo-runtime";

interface RouteContext {
  params: Promise<{ journeyId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { journeyId } = await context.params;

  return runGuardedDemoRoute(request, {
    operation: "curador.workspace.get",
    flag: DEMO_MODE_FLAGS.CURATOR_DEMO_MODE,
    guard: guardCuratorDemoAccess,
    handler: async (ctx) => {
      const { stack, flow, curatorActorId } = await getDemoCuratorWorkspaceRuntime();

      if (journeyId !== flow.journeyId) {
        return jsonRouteMessage(ctx, 404, "Jornada não disponível no demo.");
      }

      const opened = await openCuratorWorkspace(stack, {
        journeyId: flow.journeyId,
        handoffId: flow.handoffId,
        curatorActorId,
      });

      if (!opened.ok) {
        return jsonRouteMessage(ctx, 404, opened.error.message);
      }

      const view = await buildCuratorWorkspaceView(stack, {
        report: opened.value,
        handoffId: flow.handoffId,
        curatorActorId,
      });

      if (!view.ok) {
        return jsonRouteMessage(ctx, 404, view.error.message);
      }

      return jsonRouteData(ctx, 200, view.value);
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { journeyId } = await context.params;

  return runGuardedDemoRoute(request, {
    operation: "curador.workspace.post",
    flag: DEMO_MODE_FLAGS.CURATOR_DEMO_MODE,
    guard: guardCuratorDemoAccess,
    handler: async (ctx) => {
      const { stack, flow, curatorActorId } = await getDemoCuratorWorkspaceRuntime();

      if (journeyId !== flow.journeyId) {
        return jsonRouteMessage(ctx, 404, "Jornada não disponível no demo.");
      }

      const opened = await openCuratorWorkspace(stack, {
        journeyId: flow.journeyId,
        handoffId: flow.handoffId,
        curatorActorId,
      });

      if (!opened.ok) {
        return jsonRouteMessage(ctx, 404, opened.error.message);
      }

      const body = (await request.json()) as {
        action: "add_evidence" | "add_candidate" | "add_note" | "submit_for_review";
        evidence?: {
          origin: string;
          description: string;
          type: string;
          confidence: number;
          reference: string;
        };
        candidate?: {
          identification: string;
          specialty: string;
          justification: string;
          relatedEvidenceIds: string[];
          priority: number;
          selectionReasons: Array<{ criterion: string; rationale: string }>;
        };
        content?: string;
      };

      const mutationContext = {
        handoffId: flow.handoffId,
        curatorActorId,
      };

      let result;
      switch (body.action) {
        case "add_evidence": {
          const raw = body.evidence;
          if (!raw) {
            return jsonRouteMessage(ctx, 400, "Evidência obrigatória.");
          }
          if (!EVIDENCE_TYPES.includes(raw.type as EvidenceType)) {
            return jsonRouteMessage(ctx, 400, "Tipo de evidência inválido.");
          }
          result = await workspaceAddEvidence(stack, {
            reportId: opened.value.id,
            actorId: curatorActorId,
            evidence: { ...raw, type: raw.type as EvidenceType },
            ...mutationContext,
          });
          break;
        }
        case "add_candidate":
          result = await workspaceAddMedicalCandidate(stack, {
            reportId: opened.value.id,
            actorId: curatorActorId,
            candidate: body.candidate!,
            ...mutationContext,
          });
          break;
        case "add_note":
          result = await workspaceAddCuratorNote(stack, {
            reportId: opened.value.id,
            actorId: curatorActorId,
            content: body.content ?? "",
            ...mutationContext,
          });
          break;
        case "submit_for_review":
          result = await workspaceSubmitForReview(stack, {
            reportId: opened.value.id,
            actorId: curatorActorId,
            ...mutationContext,
          });
          break;
        default:
          return jsonRouteMessage(ctx, 400, "Ação inválida.");
      }

      if (!result.ok) {
        return jsonRouteMessage(ctx, 400, result.error.message);
      }

      return jsonRouteData(ctx, 200, result.value);
    },
  });
}
