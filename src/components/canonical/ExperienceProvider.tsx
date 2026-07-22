"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  fetchJornadaView,
  fetchMeJornadaView,
  JornadaApiError,
} from "@/experience-layer/api/jornada-client";
import type { CanonicalExperienceSnapshot } from "@/experience-layer/contracts/experience-models";
import { resolveCanonicalExperience } from "@/experience-layer/resolve-canonical-experience";

export type ExperienceLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; view: JornadaDoPacienteView; experience: CanonicalExperienceSnapshot };

type ExperienceFetchState = Exclude<ExperienceLoadState, { status: "idle" }>;

export interface ExperienceContextValue {
  jornadaId: string | null;
  loadState: ExperienceLoadState;
  refresh: () => Promise<void>;
  isBlocked: boolean;
  isCompleted: boolean;
  hasJornada: boolean;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

interface ExperienceProviderProps {
  jornadaId: string | null;
  mode?: "jornada-id" | "authenticated-patient";
  children: ReactNode;
}

async function loadJornadaExperience(
  jornadaId: string,
): Promise<{ view: JornadaDoPacienteView; experience: CanonicalExperienceSnapshot }> {
  const view = await fetchJornadaView(jornadaId);
  return { view, experience: resolveCanonicalExperience(view) };
}

async function loadMeJornadaExperience(): Promise<{
  view: JornadaDoPacienteView;
  experience: CanonicalExperienceSnapshot;
}> {
  const view = await fetchMeJornadaView();
  return { view, experience: resolveCanonicalExperience(view) };
}

export function ExperienceProvider({
  jornadaId,
  mode = "jornada-id",
  children,
}: ExperienceProviderProps) {
  const [fetchState, setFetchState] = useState<ExperienceFetchState>({ status: "loading" });

  const isPortalMode = mode === "authenticated-patient";
  const hasSource = isPortalMode || jornadaId !== null;
  const loadState: ExperienceLoadState = hasSource ? fetchState : { status: "idle" };

  const refresh = useCallback(async () => {
    if (!hasSource) {
      return;
    }

    setFetchState({ status: "loading" });

    try {
      const loaded = isPortalMode ? await loadMeJornadaExperience() : await loadJornadaExperience(jornadaId!);
      setFetchState({ status: "ready", ...loaded });
    } catch (error) {
      const apiError = error instanceof JornadaApiError ? error : null;
      setFetchState({
        status: "error",
        message: apiError?.message ?? "Não foi possível carregar sua jornada.",
        code: apiError?.code ?? "UNKNOWN_ERROR",
      });
    }
  }, [hasSource, isPortalMode, jornadaId]);

  useEffect(() => {
    if (!hasSource) {
      return;
    }

    let cancelled = false;

    async function load() {
      setFetchState({ status: "loading" });
      try {
        const loaded = isPortalMode
          ? await loadMeJornadaExperience()
          : await loadJornadaExperience(jornadaId!);
        if (!cancelled) {
          setFetchState({ status: "ready", ...loaded });
        }
      } catch (error) {
        if (cancelled) return;
        const apiError = error instanceof JornadaApiError ? error : null;
        setFetchState({
          status: "error",
          message: apiError?.message ?? "Não foi possível carregar sua jornada.",
          code: apiError?.code ?? "UNKNOWN_ERROR",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasSource, isPortalMode, jornadaId]);

  const value = useMemo<ExperienceContextValue>(() => {
    const view = loadState.status === "ready" ? loadState.view : null;
    const resolvedJornadaId = view?.jornada_id ?? jornadaId;

    return {
      jornadaId: resolvedJornadaId,
      loadState,
      refresh,
      hasJornada: loadState.status === "ready",
      isBlocked: view?.bloqueio !== null && view?.bloqueio !== undefined,
      isCompleted: view?.concluida_em !== null && view?.concluida_em !== undefined,
    };
  }, [jornadaId, loadState, refresh]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceContextValue {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience deve ser usado dentro de ExperienceProvider");
  }
  return context;
}
