"use client";

import { useState } from "react";

import { NextStepCard } from "@/components/canonical";
import { postApiCommand } from "@/experience-layer/api/jornada-client";
import type { EscolhaExperienceModel } from "@/experience-layer/contracts/experience-models";

interface EscolhaPortalSurfaceProps {
  model: EscolhaExperienceModel;
  onChosen: () => Promise<void>;
}

export function EscolhaPortalSurface({ model, onChosen }: EscolhaPortalSurfaceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (selected === null) return;
    setLoading(true);
    setError(null);
    try {
      await postApiCommand("/api/v1/me/escolha", { opcao_indice: selected });
      await onChosen();
    } catch {
      setError("Não foi possível registrar sua escolha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="escolha-portal-surface" className="space-y-6">
      <NextStepCard proximo_passo={model.proximo_passo} />

      <section aria-label="Escolha consciente">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Confirme sua escolha</h2>
        <div className="space-y-3">
          {model.opcoes.map((opcao) => (
            <label
              key={opcao.indice}
              className={`card flex cursor-pointer gap-3 p-4 ${selected === opcao.indice ? "ring-2 ring-coral" : ""}`}
            >
              <input
                type="radio"
                name="escolha"
                value={opcao.indice}
                checked={selected === opcao.indice}
                onChange={() => setSelected(opcao.indice)}
                data-testid={`escolha-radio-${opcao.indice}`}
              />
              <span>
                <span className="font-medium text-ink">{opcao.nome}</span>
                <span className="block text-sm text-ink-soft">{opcao.especialidade}</span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary mt-6"
          disabled={selected === null || loading}
          onClick={() => void handleConfirm()}
          data-testid="escolha-confirmar"
        >
          {loading ? "Registrando..." : "Confirmar escolha"}
        </button>
      </section>

      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
