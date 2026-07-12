"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { saveStoryDraftAction, submitStoryAction } from "./actions";
import { clearStoryCache, loadStoryCache, saveStoryCache } from "./storage";
import { STORY_STEPS, type PatientStory, type StoryStatus, type StoryStep, type SuaHistoriaData } from "./types";

const AUTOSAVE_DEBOUNCE_MS = 600;

type StoryDraftContextValue = {
  data: SuaHistoriaData;
  update: (patch: Partial<SuaHistoriaData>) => void;
  status: StoryStatus;
  storyId: string;
  isSaving: boolean;
  hasConflict: boolean;
  dismissConflict: () => void;
  submit: () => Promise<{ success: boolean; error?: string }>;
};

const StoryDraftContext = createContext<StoryDraftContextValue | null>(null);

function stepFromPathname(pathname: string): StoryStep | null {
  const segment = pathname.split("/").pop() ?? "";
  return (STORY_STEPS as readonly string[]).includes(segment) ? (segment as StoryStep) : null;
}

type StoryDraftProviderProps = {
  story: PatientStory;
  children: ReactNode;
};

// Fonte da verdade é sempre o servidor (ADR-018) — este Provider mantém uma
// cópia local só para resposta instantânea de UI, autosave debounced, e
// recuperação a partir do cache transitório (storage.ts) quando o servidor
// não confirmou a última escrita (aba fechada, rede caiu).
export function StoryDraftProvider({ story, children }: StoryDraftProviderProps) {
  const pathname = usePathname();
  const [current, setCurrent] = useState(story);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const currentRef = useRef(current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveredRef = useRef(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const persist = useCallback(async (nextData: SuaHistoriaData, step: StoryStep) => {
    const snapshot = currentRef.current;
    setIsSaving(true);

    saveStoryCache({
      storyId: snapshot.id,
      revision: snapshot.revision,
      data: nextData,
      currentStep: step,
      savedAt: new Date().toISOString(),
      pending: true,
    });

    const result = await saveStoryDraftAction({
      storyId: snapshot.id,
      expectedRevision: snapshot.revision,
      patch: nextData,
      currentStep: step,
    });

    if (result.outcome === "saved") {
      setCurrent(result.story);
      setHasConflict(false);
      saveStoryCache({
        storyId: result.story.id,
        revision: result.story.revision,
        data: result.story.data,
        currentStep: result.story.currentStep,
        savedAt: new Date().toISOString(),
        pending: false,
      });
    } else if (result.outcome === "conflict") {
      setCurrent(result.story);
      setHasConflict(true);
      clearStoryCache(snapshot.id);
    }

    setIsSaving(false);
  }, []);

  // Recuperação: se o cache local tiver uma edição pendente mais recente do
  // que o que o servidor retornou nesta carga de página, ela nunca chegou a
  // ser confirmada (aba fechada, rede caiu antes do autosave) — reaplica e
  // tenta salvar de novo.
  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;

    const cached = loadStoryCache(story.id);
    if (cached?.pending && new Date(cached.savedAt).getTime() > new Date(story.updatedAt).getTime()) {
      setCurrent((prev) => ({ ...prev, data: cached.data, currentStep: cached.currentStep }));
      void persist(cached.data, cached.currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Acompanha a URL para saber em que etapa a pessoa está — nenhuma página
  // do wizard precisa declarar isso manualmente.
  useEffect(() => {
    const step = stepFromPathname(pathname);
    if (step && step !== currentRef.current.currentStep) {
      void persist(currentRef.current.data, step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const update = useCallback(
    (patch: Partial<SuaHistoriaData>) => {
      setCurrent((prev) => {
        const nextData = { ...prev.data, ...patch };

        saveStoryCache({
          storyId: prev.id,
          revision: prev.revision,
          data: nextData,
          currentStep: prev.currentStep,
          savedAt: new Date().toISOString(),
          pending: true,
        });

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void persist(nextData, prev.currentStep);
        }, AUTOSAVE_DEBOUNCE_MS);

        return { ...prev, data: nextData };
      });
    },
    [persist],
  );

  const submit = useCallback(async () => {
    const snapshot = currentRef.current;
    const result = await submitStoryAction({ storyId: snapshot.id, expectedRevision: snapshot.revision });

    if (result.success) {
      setCurrent(result.story);
      clearStoryCache(snapshot.id);
      return { success: true };
    }

    return { success: false, error: result.error };
  }, []);

  const value: StoryDraftContextValue = {
    data: current.data,
    update,
    status: current.status,
    storyId: current.id,
    isSaving,
    hasConflict,
    dismissConflict: () => setHasConflict(false),
    submit,
  };

  return <StoryDraftContext.Provider value={value}>{children}</StoryDraftContext.Provider>;
}

export function useStoryDraft(): StoryDraftContextValue {
  const context = useContext(StoryDraftContext);
  if (!context) {
    throw new Error("useStoryDraft precisa ser usado dentro de um StoryDraftProvider.");
  }
  return context;
}
