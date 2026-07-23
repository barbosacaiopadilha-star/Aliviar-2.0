import {
  addEvidence,
  addMedicalCandidate,
  addCuratorNote,
  submitReportForReview,
  type CurationReportSnapshot,
} from "@/curation-report";
import type { AddEvidenceInput, AddMedicalCandidateInput } from "@/curation-report";

import type { CuratorWorkspaceStack } from "../composition/curator-workspace-stack";
import { curationReportMutationDeps } from "../composition/curator-workspace-stack";
import { buildCuratorWorkspaceView } from "./build-curator-workspace-view";
import type { CuratorWorkspaceView } from "../model/curator-workspace-view";

export type WorkspaceMutationResult =
  | { ok: true; value: CuratorWorkspaceView }
  | { ok: false; error: { code: "NOT_FOUND" | "DOMAIN_ERROR"; message: string } };

export interface WorkspaceMutationContext {
  handoffId: string;
  curatorActorId: string;
}

async function toWorkspaceView(
  stack: CuratorWorkspaceStack,
  report: CurationReportSnapshot,
  ctx: WorkspaceMutationContext,
): Promise<WorkspaceMutationResult> {
  const view = await buildCuratorWorkspaceView(stack, {
    report,
    handoffId: ctx.handoffId,
    curatorActorId: ctx.curatorActorId,
  });

  if (!view.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: view.error.message } };
  }

  return { ok: true, value: view.value };
}

export async function workspaceAddEvidence(
  stack: CuratorWorkspaceStack,
  input: {
    reportId: string;
    actorId: string;
    evidence: AddEvidenceInput;
  } & WorkspaceMutationContext,
): Promise<WorkspaceMutationResult> {
  const result = await addEvidence(curationReportMutationDeps(stack), {
    reportId: input.reportId,
    actorId: input.actorId,
    evidence: input.evidence,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: result.error.code === "NOT_FOUND" ? "NOT_FOUND" : "DOMAIN_ERROR",
        message: result.error.message,
      },
    };
  }

  return toWorkspaceView(stack, result.value, input);
}

export async function workspaceAddMedicalCandidate(
  stack: CuratorWorkspaceStack,
  input: {
    reportId: string;
    actorId: string;
    candidate: AddMedicalCandidateInput;
  } & WorkspaceMutationContext,
): Promise<WorkspaceMutationResult> {
  const result = await addMedicalCandidate(curationReportMutationDeps(stack), {
    reportId: input.reportId,
    actorId: input.actorId,
    candidate: input.candidate,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: result.error.code === "NOT_FOUND" ? "NOT_FOUND" : "DOMAIN_ERROR",
        message: result.error.message,
      },
    };
  }

  return toWorkspaceView(stack, result.value, input);
}

export async function workspaceAddCuratorNote(
  stack: CuratorWorkspaceStack,
  input: {
    reportId: string;
    actorId: string;
    content: string;
  } & WorkspaceMutationContext,
): Promise<WorkspaceMutationResult> {
  const result = await addCuratorNote(curationReportMutationDeps(stack), {
    reportId: input.reportId,
    actorId: input.actorId,
    content: input.content,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: result.error.code === "NOT_FOUND" ? "NOT_FOUND" : "DOMAIN_ERROR",
        message: result.error.message,
      },
    };
  }

  return toWorkspaceView(stack, result.value, input);
}

export async function workspaceSubmitForReview(
  stack: CuratorWorkspaceStack,
  input: {
    reportId: string;
    actorId: string;
  } & WorkspaceMutationContext,
): Promise<WorkspaceMutationResult> {
  const result = await submitReportForReview(curationReportMutationDeps(stack), {
    reportId: input.reportId,
    actorId: input.actorId,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: {
        code: result.error.code === "NOT_FOUND" ? "NOT_FOUND" : "DOMAIN_ERROR",
        message: result.error.message,
      },
    };
  }

  return toWorkspaceView(stack, result.value, input);
}
