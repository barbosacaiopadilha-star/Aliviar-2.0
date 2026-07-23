export type { CuratorWorkspaceView, CuratorWorkspaceEvidenceView, CuratorWorkspaceCandidateView, CuratorWorkspaceNoteView } from "./model/curator-workspace-view";

export {
  createCuratorWorkspaceStack,
  curationReportMutationDeps,
  curationReportFullDeps,
} from "./composition/curator-workspace-stack";
export type { CuratorWorkspaceStack } from "./composition/curator-workspace-stack";

export { REPORT_STATUS_LABELS, OPERATIONAL_STAGE_LABELS, reportStatusLabel, isWorkspaceEditable } from "./labels";

export { openCuratorWorkspace, ensureCurationReportForWorkspace } from "./services/open-curator-workspace";
export { buildCuratorWorkspaceView } from "./services/build-curator-workspace-view";
export {
  workspaceAddEvidence,
  workspaceAddMedicalCandidate,
  workspaceAddCuratorNote,
  workspaceSubmitForReview,
} from "./services/workspace-mutations";

export {
  getDemoCuratorWorkspaceRuntime,
  resetDemoCuratorWorkspaceRuntime,
  DEMO_CURATOR_ID,
} from "./infrastructure/demo-curator-workspace-runtime";
