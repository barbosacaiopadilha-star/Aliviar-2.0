"use client";

import { curadorPost } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";

export function WorkspaceCuradorSurface({
  model,
  onAction,
}: {
  model: CasoCuradorExperienceModel;
  onAction: () => Promise<void>;
}) {
  const base = `/api/v1/curador/casos/${model.caso.jornada_id}`;

  async function handleAssumir() {
    await curadorPost(`${base}/assumir`);
    await onAction();
  }

  async function handleAbrirSessao() {
    await curadorPost(`${base}/sessao`);
    await onAction();
  }

  return (
    <div className="space-y-6" data-testid="workspace-curador-surface">
      <section className="card p-5">
        <h2 className="font-medium text-ink">Sessão de Curadoria</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Status: {model.caso.sessao.status.replaceAll("_", " ")}
        </p>
        {model.pode_assumir ? (
          <button type="button" className="btn-primary mt-4" onClick={() => void handleAssumir()}>
            Assumir caso
          </button>
        ) : null}
        {model.pode_abrir_sessao ? (
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => void handleAbrirSessao()}
            data-testid="abrir-sessao"
          >
            Abrir sessão de curadoria
          </button>
        ) : null}
      </section>

      {model.caso.conjunto_elegivel ? (
        <section className="card p-5">
          <h2 className="font-medium text-ink">Conjunto elegível</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {model.caso.conjunto_elegivel.candidatos.map((c) => (
              <li key={c.id}>
                {c.nome} — {c.especialidade}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
