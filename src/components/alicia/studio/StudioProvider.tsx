"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ReviewCase } from "@/alicia/protocol-engine";
import type { PipelineReviewCase } from "@/alicia/publication-pipeline";
import { createInitialStudioState, STUDIO_STORAGE_KEY } from "@/alicia/studio/mock-data";
import {
  evaluateCandidateProtocol,
  getStudioReviewCases,
  type StudioProtocolEvaluation,
} from "@/alicia/studio/protocol-bridge";
import {
  getPublicationReviewCases,
  getSessionPublicationPipeline,
} from "@/alicia/studio/publication-bridge";
import {
  addSource,
  computeDashboardMetrics,
  getCandidate,
  removeSource,
  updateCandidateStatus,
  updateChecklistItem,
  updateSource,
} from "@/alicia/studio/studio-store";
import type {
  ChecklistItemState,
  StudioCandidate,
  StudioCandidateStatus,
  StudioDashboardMetrics,
  StudioSource,
  StudioState,
} from "@/alicia/studio/types";

type StudioContextValue = {
  state: StudioState;
  metrics: StudioDashboardMetrics;
  reviewCases: ReviewCase[];
  publicationReviewCases: PipelineReviewCase[];
  getCandidateById: (id: string) => StudioCandidate | undefined;
  getProtocolEvaluation: (candidateId: string) => StudioProtocolEvaluation | undefined;
  setStatus: (candidateId: string, status: StudioCandidateStatus) => void;
  setChecklistItem: (candidateId: string, itemId: string, state: ChecklistItemState) => void;
  addCandidateSource: (candidateId: string, source: Omit<StudioSource, "id">) => void;
  editCandidateSource: (
    candidateId: string,
    sourceId: string,
    patch: Partial<Omit<StudioSource, "id">>,
  ) => void;
  deleteCandidateSource: (candidateId: string, sourceId: string) => void;
  resetToSeed: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function loadState(): StudioState {
  if (typeof window === "undefined") {
    return createInitialStudioState();
  }
  try {
    const raw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
    if (!raw) {
      return createInitialStudioState();
    }
    return JSON.parse(raw) as StudioState;
  } catch {
    return createInitialStudioState();
  }
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(createInitialStudioState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setState(loadState());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const metrics = useMemo(() => computeDashboardMetrics(state), [state]);
  const reviewCases = useMemo(() => getStudioReviewCases(state.candidates), [state.candidates]);
  const publicationReviewCases = useMemo(
    () => getPublicationReviewCases(state.candidates, getSessionPublicationPipeline()),
    [state.candidates],
  );

  const getProtocolEvaluation = useCallback(
    (candidateId: string) => {
      const candidate = getCandidate(state, candidateId);
      if (!candidate) {
        return undefined;
      }
      return evaluateCandidateProtocol(candidate);
    },
    [state],
  );

  const setStatus = useCallback((candidateId: string, status: StudioCandidateStatus) => {
    setState((current) => updateCandidateStatus(current, candidateId, status));
  }, []);

  const setChecklistItem = useCallback(
    (candidateId: string, itemId: string, itemState: ChecklistItemState) => {
      setState((current) => updateChecklistItem(current, candidateId, itemId, itemState));
    },
    [],
  );

  const addCandidateSource = useCallback(
    (candidateId: string, source: Omit<StudioSource, "id">) => {
      setState((current) => addSource(current, candidateId, source));
    },
    [],
  );

  const editCandidateSource = useCallback(
    (
      candidateId: string,
      sourceId: string,
      patch: Partial<Omit<StudioSource, "id">>,
    ) => {
      setState((current) => updateSource(current, candidateId, sourceId, patch));
    },
    [],
  );

  const deleteCandidateSource = useCallback((candidateId: string, sourceId: string) => {
    setState((current) => removeSource(current, candidateId, sourceId));
  }, []);

  const resetToSeed = useCallback(() => {
    const seed = createInitialStudioState();
    setState(seed);
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(seed));
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      metrics,
      reviewCases,
      publicationReviewCases,
      getCandidateById: (id) => getCandidate(state, id),
      getProtocolEvaluation,
      setStatus,
      setChecklistItem,
      addCandidateSource,
      editCandidateSource,
      deleteCandidateSource,
      resetToSeed,
    }),
    [
      state,
      metrics,
      reviewCases,
      publicationReviewCases,
      getProtocolEvaluation,
      setStatus,
      setChecklistItem,
      addCandidateSource,
      editCandidateSource,
      deleteCandidateSource,
      resetToSeed,
    ],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-ink-soft">
        Carregando Studio…
      </div>
    );
  }

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio deve ser usado dentro de StudioProvider.");
  }
  return context;
}
