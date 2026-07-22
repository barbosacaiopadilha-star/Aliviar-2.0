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

import type { CasoDeCuradoriaView } from "@/curator-flow/contracts/curador-view";
import {
  CuradorApiError,
  fetchCasoCurador,
  fetchFilaCurador,
} from "@/curator-layer/api/curador-client";
import {
  mapCasoCuradorExperience,
  mapFilaCuradorExperience,
  type CuratorExperienceSnapshot,
} from "@/curator-layer/resolve-curator-experience";

type CuratorLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; snapshot: CuratorExperienceSnapshot };

interface CuratorContextValue {
  loadState: CuratorLoadState;
  refresh: () => Promise<void>;
  jornadaId: string | null;
}

const CuratorContext = createContext<CuratorContextValue | null>(null);

async function loadCuratorSnapshot(
  jornadaId: string | null,
): Promise<CuratorExperienceSnapshot> {
  if (jornadaId) {
    const caso: CasoDeCuradoriaView = await fetchCasoCurador(jornadaId);
    return {
      fila: null,
      caso: mapCasoCuradorExperience(caso),
    };
  }

  const itens = await fetchFilaCurador();
  return {
    fila: mapFilaCuradorExperience(itens),
    caso: null,
  };
}

export function CuratorProvider({
  jornadaId,
  children,
}: {
  jornadaId: string | null;
  children: ReactNode;
}) {
  const [loadState, setLoadState] = useState<CuratorLoadState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setLoadState({ status: "loading" });
    try {
      const snapshot = await loadCuratorSnapshot(jornadaId);
      setLoadState({ status: "ready", snapshot });
    } catch (error) {
      const apiError = error instanceof CuradorApiError ? error : null;
      setLoadState({
        status: "error",
        message: apiError?.message ?? "Não foi possível carregar os dados.",
      });
    }
  }, [jornadaId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      try {
        const snapshot = await loadCuratorSnapshot(jornadaId);
        if (!cancelled) {
          setLoadState({ status: "ready", snapshot });
        }
      } catch (error) {
        if (cancelled) return;
        const apiError = error instanceof CuradorApiError ? error : null;
        setLoadState({
          status: "error",
          message: apiError?.message ?? "Não foi possível carregar os dados.",
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [jornadaId]);

  const value = useMemo(
    () => ({ loadState, refresh, jornadaId }),
    [loadState, refresh, jornadaId],
  );

  return <CuratorContext.Provider value={value}>{children}</CuratorContext.Provider>;
}

export function useCurator(): CuratorContextValue {
  const ctx = useContext(CuratorContext);
  if (!ctx) {
    throw new Error("useCurator deve ser usado dentro de CuratorProvider");
  }
  return ctx;
}
