"use client";

import { useCurator } from "@/components/curador/CuratorProvider";
import { FilaCuradorSurface } from "@/components/curador/surfaces/FilaCuradorSurface";

export function FilaCuradorContent() {
  const { loadState } = useCurator();

  if (loadState.status === "loading") {
    return <p className="text-ink-soft">Carregando fila...</p>;
  }

  if (loadState.status === "error") {
    return <p className="text-coral">{loadState.message}</p>;
  }

  if (!loadState.snapshot.fila) {
    return null;
  }

  return <FilaCuradorSurface model={loadState.snapshot.fila} />;
}
