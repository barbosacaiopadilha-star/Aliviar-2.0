import type { StoryStep, SuaHistoriaData } from "./types";

// Cache transitório de segurança (ADR-018) — NUNCA a fonte da verdade. Cobre
// só três situações: perda momentânea de conexão, refresh antes da
// confirmação do autosave, e recuperação local após erro de rede. O servidor
// (patient_stories) é sempre a fonte da verdade; depois de uma sincronização
// confirmada, este cache é atualizado para espelhar exatamente o que o
// servidor tem.
export type StoryCacheEntry = {
  storyId: string;
  revision: number;
  data: SuaHistoriaData;
  currentStep: StoryStep;
  savedAt: string;
  pending: boolean;
};

const CACHE_KEY_PREFIX = "aliviar:sua-historia:cache:";

function cacheKey(storyId: string): string {
  return `${CACHE_KEY_PREFIX}${storyId}`;
}

export function loadStoryCache(storyId: string): StoryCacheEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(storyId));
    return raw ? (JSON.parse(raw) as StoryCacheEntry) : null;
  } catch {
    return null;
  }
}

export function saveStoryCache(entry: StoryCacheEntry): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey(entry.storyId), JSON.stringify(entry));
  } catch {
    // Armazenamento indisponível (modo privado, cota excedida) — a fundação
    // permanente é o servidor; a ausência do cache local não é um erro
    // fatal, só reduz a rede de segurança para o cenário raro de fechar a
    // aba entre o autosave disparar e confirmar.
  }
}

export function clearStoryCache(storyId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(cacheKey(storyId));
  } catch {
    // idem
  }
}
