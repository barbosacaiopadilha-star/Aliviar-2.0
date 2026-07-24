"use client";

import { useState } from "react";

import { curadorPost, curadorPut } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";

export function DevolutivaCuradorSurface({
  model,
  onAction,
}: {
  model: CasoCuradorExperienceModel;
  onAction: () => Promise<void>;
}) {
  const devolutiva = model.caso.caso_curadoria?.devolutiva;
  const dossieId = model.caso.caso_curadoria?.dossie?.id;

  const [dataDevolutiva, setDataDevolutiva] = useState(
    devolutiva?.data_devolutiva?.slice(0, 16) ?? "",
  );
  const [dossieApresentado, setDossieApresentado] = useState(
    devolutiva?.dossie_apresentado ?? false,
  );
  const [duvidas, setDuvidas] = useState(
    devolutiva?.duvidas_relevantes?.join("\n") ?? "",
  );
  const [loading, setLoading] = useState(false);

  const base = `/api/v1/curador/casos/${model.caso.jornada_id}`;

  async function handleSalvar() {
    if (!dossieId) return;
    setLoading(true);
    try {
      await curadorPut(`${base}/devolutiva`, {
        dossie_id: dossieId,
        data_devolutiva: dataDevolutiva ? new Date(dataDevolutiva).toISOString() : null,
        dossie_apresentado: dossieApresentado,
        duvidas_relevantes: duvidas
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
      });
      await onAction();
    } finally {
      setLoading(false);
    }
  }

  async function handleConcluir() {
    if (!devolutiva?.id) return;
    setLoading(true);
    try {
      await curadorPost(`${base}/devolutiva/concluir`, { devolutiva_id: devolutiva.id });
      await onAction();
    } finally {
      setLoading(false);
    }
  }

  if (!devolutiva) {
    return (
      <p className="text-ink-soft" data-testid="devolutiva-indisponivel">
        Devolutiva ainda não disponível para este caso.
      </p>
    );
  }

  return (
    <div className="space-y-6" data-testid="devolutiva-curador-surface">
      <section className="card p-5">
        <h2 className="font-medium text-ink">Reunião de devolutiva</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Registre o encontro com o paciente após a publicação do dossiê.
        </p>

        <label className="mt-4 block text-sm">
          <span className="text-ink-soft">Data da devolutiva</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={dataDevolutiva}
            onChange={(e) => setDataDevolutiva(e.target.value)}
            data-testid="data-devolutiva"
          />
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dossieApresentado}
            onChange={(e) => setDossieApresentado(e.target.checked)}
            data-testid="dossie-apresentado"
          />
          <span className="text-ink-soft">Dossiê apresentado ao paciente</span>
        </label>

        <label className="mt-4 block text-sm">
          <span className="text-ink-soft">Dúvidas relevantes (uma por linha)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            rows={4}
            value={duvidas}
            onChange={(e) => setDuvidas(e.target.value)}
            data-testid="duvidas-relevantes"
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => void handleSalvar()}
            data-testid="salvar-devolutiva"
          >
            Salvar devolutiva
          </button>
          {model.pode_concluir_devolutiva ? (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => void handleConcluir()}
              data-testid="concluir-devolutiva"
            >
              Concluir devolutiva
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
