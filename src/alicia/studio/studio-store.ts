import { createDefaultChecklist } from "./operational-checklist";
import type {
  ChecklistItemState,
  StudioCandidate,
  StudioCandidateStatus,
  StudioDashboardMetrics,
  StudioHistoryEntry,
  StudioSource,
  StudioState,
} from "./types";
import { STUDIO_STATUSES } from "./types";

const MS_PER_DAY = 86_400_000;

function nowIso(): string {
  return new Date().toISOString();
}

function entryId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sourceId(): string {
  return `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendHistory(
  candidate: StudioCandidate,
  action: StudioHistoryEntry["action"],
  detail: string,
  actor: string,
): StudioHistoryEntry[] {
  return [
    ...candidate.history,
    {
      id: entryId(),
      at: nowIso(),
      actor,
      action,
      detail,
    },
  ];
}

function updateCandidate(
  state: StudioState,
  candidateId: string,
  updater: (candidate: StudioCandidate) => StudioCandidate,
): StudioState {
  return {
    ...state,
    candidates: state.candidates.map((c) => (c.id === candidateId ? updater(c) : c)),
  };
}

export function getCandidate(state: StudioState, candidateId: string): StudioCandidate | undefined {
  return state.candidates.find((c) => c.id === candidateId);
}

export function updateCandidateStatus(
  state: StudioState,
  candidateId: string,
  status: StudioCandidateStatus,
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  return updateCandidate(state, candidateId, (candidate) => {
    const publishedAt =
      status === "publicado" ? timestamp : candidate.publishedAt;
    return {
      ...candidate,
      status,
      updatedAt: timestamp,
      statusChangedAt: timestamp,
      publishedAt,
      history: appendHistory(
        candidate,
        "status_alterado",
        `Status alterado para ${status}.`,
        actor,
      ),
    };
  });
}

export function updateChecklistItem(
  state: StudioState,
  candidateId: string,
  itemId: string,
  itemState: ChecklistItemState,
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  return updateCandidate(state, candidateId, (candidate) => ({
    ...candidate,
    updatedAt: timestamp,
    checklist: candidate.checklist.map((item) =>
      item.id === itemId ? { ...item, state: itemState } : item,
    ),
    history: appendHistory(
      candidate,
      "checklist_atualizado",
      `Checklist ${itemId} → ${itemState}.`,
      actor,
    ),
  }));
}

export function addSource(
  state: StudioState,
  candidateId: string,
  source: Omit<StudioSource, "id">,
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  const newSource: StudioSource = { ...source, id: sourceId() };
  return updateCandidate(state, candidateId, (candidate) => ({
    ...candidate,
    updatedAt: timestamp,
    sources: [...candidate.sources, newSource],
    history: appendHistory(
      candidate,
      "fonte_adicionada",
      `Fonte adicionada: ${newSource.name}.`,
      actor,
    ),
  }));
}

export function updateSource(
  state: StudioState,
  candidateId: string,
  sourceIdValue: string,
  patch: Partial<Omit<StudioSource, "id">>,
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  return updateCandidate(state, candidateId, (candidate) => ({
    ...candidate,
    updatedAt: timestamp,
    sources: candidate.sources.map((s) =>
      s.id === sourceIdValue ? { ...s, ...patch } : s,
    ),
    history: appendHistory(
      candidate,
      "fonte_editada",
      `Fonte editada: ${sourceIdValue}.`,
      actor,
    ),
  }));
}

export function removeSource(
  state: StudioState,
  candidateId: string,
  sourceIdValue: string,
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  return updateCandidate(state, candidateId, (candidate) => {
    const removed = candidate.sources.find((s) => s.id === sourceIdValue);
    return {
      ...candidate,
      updatedAt: timestamp,
      sources: candidate.sources.filter((s) => s.id !== sourceIdValue),
      history: appendHistory(
        candidate,
        "fonte_removida",
        `Fonte removida: ${removed?.name ?? sourceIdValue}.`,
        actor,
      ),
    };
  });
}

export function assignNivel(
  state: StudioState,
  candidateId: string,
  nivel: "A" | "B",
  actor: string = state.defaultActor,
): StudioState {
  const timestamp = nowIso();
  return updateCandidate(state, candidateId, (candidate) => ({
    ...candidate,
    nivel,
    updatedAt: timestamp,
    history: appendHistory(
      candidate,
      "nivel_atribuido",
      `Nível operacional atribuído: ${nivel}.`,
      actor,
    ),
  }));
}

export function computeDashboardMetrics(state: StudioState): StudioDashboardMetrics {
  const active = state.candidates.filter((c) => c.status !== "arquivado");
  const backlog = active.filter((c) => c.status !== "publicado").length;
  const nivelA = state.candidates.filter((c) => c.nivel === "A").length;
  const nivelB = state.candidates.filter((c) => c.nivel === "B").length;
  const pendencies = state.candidates.reduce((sum, c) => sum + c.pendencies.length, 0);

  const published = state.candidates.filter((c) => c.publishedAt && c.createdAt);
  const averageDaysToPublish =
    published.length === 0
      ? null
      : published.reduce((sum, c) => {
          const days =
            (new Date(c.publishedAt!).getTime() - new Date(c.createdAt).getTime()) / MS_PER_DAY;
          return sum + days;
        }, 0) / published.length;

  const byStatus = STUDIO_STATUSES.reduce(
    (acc, status) => {
      acc[status] = state.candidates.filter((c) => c.status === status).length;
      return acc;
    },
    {} as Record<StudioCandidateStatus, number>,
  );

  return {
    backlog,
    nivelA,
    nivelB,
    pendencies,
    averageDaysToPublish,
    byStatus,
  };
}

export function createCandidate(input: {
  id: string;
  caseId: string;
  name: string;
  crm?: string;
  rqe?: string;
  city: string;
  specialty: string;
  status: StudioCandidateStatus;
  nivel?: "A" | "B";
  sources?: StudioSource[];
  pendencies?: string[];
  checklistStates?: Partial<Record<string, ChecklistItemState>>;
  createdAt?: string;
  publishedAt?: string;
  actor?: string;
}): StudioCandidate {
  const createdAt = input.createdAt ?? nowIso();
  const actor = input.actor ?? "Operador AliCIA";
  const candidate: StudioCandidate = {
    id: input.id,
    caseId: input.caseId,
    name: input.name,
    crm: input.crm ?? "",
    rqe: input.rqe ?? "",
    city: input.city,
    specialty: input.specialty,
    status: input.status,
    nivel: input.nivel,
    checklist: createDefaultChecklist(input.checklistStates),
    sources: input.sources ?? [],
    pendencies: input.pendencies ?? [],
    history: [],
    createdAt,
    updatedAt: createdAt,
    statusChangedAt: createdAt,
    publishedAt: input.publishedAt,
  };

  return {
    ...candidate,
    history: appendHistory(candidate, "caso_criado", `Caso ${input.caseId} aberto.`, actor),
  };
}
