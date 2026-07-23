import { NextResponse } from "next/server";

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

interface RouteContext {
  params: Promise<{ journeyId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { journeyId } = await context.params;
    const { stack, flow, curatorActorId } = await getDemoCuratorWorkspaceRuntime();

    if (journeyId !== flow.journeyId) {
      return NextResponse.json({ message: "Jornada não disponível no demo." }, { status: 404 });
    }

    const opened = await openCuratorWorkspace(stack, {
      journeyId: flow.journeyId,
      handoffId: flow.handoffId,
      curatorActorId,
    });

    if (!opened.ok) {
      return NextResponse.json({ message: opened.error.message }, { status: 404 });
    }

    const view = await buildCuratorWorkspaceView(stack, {
      report: opened.value,
      handoffId: flow.handoffId,
      curatorActorId,
    });

    if (!view.ok) {
      return NextResponse.json({ message: view.error.message }, { status: 404 });
    }

    return NextResponse.json(view.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao abrir workspace.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { journeyId } = await context.params;
    const { stack, flow, curatorActorId } = await getDemoCuratorWorkspaceRuntime();

    if (journeyId !== flow.journeyId) {
      return NextResponse.json({ message: "Jornada não disponível no demo." }, { status: 404 });
    }

    const opened = await openCuratorWorkspace(stack, {
      journeyId: flow.journeyId,
      handoffId: flow.handoffId,
      curatorActorId,
    });

    if (!opened.ok) {
      return NextResponse.json({ message: opened.error.message }, { status: 404 });
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
          return NextResponse.json({ message: "Evidência obrigatória." }, { status: 400 });
        }
        if (!EVIDENCE_TYPES.includes(raw.type as EvidenceType)) {
          return NextResponse.json({ message: "Tipo de evidência inválido." }, { status: 400 });
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
        return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
    }

    if (!result.ok) {
      return NextResponse.json({ message: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na operação do workspace.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
