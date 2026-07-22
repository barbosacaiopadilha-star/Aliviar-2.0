"use client";

import { useState } from "react";

import { HumanContactCard, NextStepCard } from "@/components/canonical";
import { postApiCommand } from "@/experience-layer/api/jornada-client";
import type { OnboardingExperienceModel } from "@/experience-layer/contracts/experience-models";

interface OnboardingPortalSurfaceProps {
  model: OnboardingExperienceModel;
  onAdvanced: () => Promise<void>;
}

export function OnboardingPortalSurface({ model, onAdvanced }: OnboardingPortalSurfaceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdvance() {
    setLoading(true);
    setError(null);
    try {
      await postApiCommand("/api/v1/me/onboarding/avancar");
      await onAdvanced();
    } catch {
      setError("Não foi possível avançar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="onboarding-portal-surface" className="space-y-6">
      <NextStepCard proximo_passo={model.proximo_passo} />
      {model.gestor ? (
        <HumanContactCard responsavel={model.gestor} mensagem="Quem coordena sua jornada." />
      ) : null}
      {model.proximo_passo.acao_disponivel ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => void handleAdvance()}
          disabled={loading}
          data-testid="onboarding-avancar"
        >
          {loading ? "Salvando..." : "Continuar"}
        </button>
      ) : null}
      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
