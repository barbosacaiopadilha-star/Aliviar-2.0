"use client";

import type { ReactNode } from "react";

import { useExperience } from "./ExperienceProvider";

interface ExperienceStateGateProps {
  children: ReactNode;
  requireJornada?: boolean;
}

export function ExperienceStateGate({ children, requireJornada = true }: ExperienceStateGateProps) {
  const { jornadaId, loadState } = useExperience();

  if (requireJornada && !jornadaId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center" data-testid="experience-no-jornada">
        <h1 className="font-serif text-2xl font-semibold text-ink">Jornada não encontrada</h1>
        <p className="mt-3 text-ink-soft">
          Use o link que a Aliviar enviou para acessar sua jornada.
        </p>
      </div>
    );
  }

  if (loadState.status === "idle" || loadState.status === "loading") {
    return (
      <div
        className="mx-auto max-w-lg px-6 py-16 text-center"
        data-testid="experience-loading"
        role="status"
        aria-live="polite"
      >
        <p className="text-ink-soft">Carregando sua jornada…</p>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center" data-testid="experience-error">
        <h1 className="font-serif text-2xl font-semibold text-ink">Algo deu errado</h1>
        <p className="mt-3 text-ink-soft">{loadState.message}</p>
      </div>
    );
  }

  if (loadState.status === "ready" && loadState.view.concluida_em) {
    return (
      <div data-testid="experience-completed">
        {children}
        <p className="sr-only">Jornada concluída</p>
      </div>
    );
  }

  if (loadState.status === "ready" && loadState.view.bloqueio) {
    return (
      <div data-testid="experience-blocked">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
