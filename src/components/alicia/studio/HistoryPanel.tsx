"use client";

import { useStudio } from "./StudioProvider";

const ACTION_LABELS: Record<string, string> = {
  caso_criado: "Caso criado",
  status_alterado: "Status alterado",
  checklist_atualizado: "Checklist atualizado",
  fonte_adicionada: "Fonte adicionada",
  fonte_editada: "Fonte editada",
  fonte_removida: "Fonte removida",
  nivel_atribuido: "Nível atribuído",
  pendencia_registrada: "Pendência registrada",
};

export function HistoryPanel({ candidateId }: { candidateId: string }) {
  const { getCandidateById } = useStudio();
  const candidate = getCandidateById(candidateId);

  if (!candidate) {
    return null;
  }

  const history = [...candidate.history].reverse();

  return (
    <section className="card p-6" data-testid="studio-history">
      <h2 className="text-sm font-semibold text-ink">Histórico</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Registro append-only — {history.length} evento(s)
      </p>

      <ol className="mt-4 space-y-3">
        {history.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-line bg-paper px-3 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-ink">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              <time className="text-xs text-ink-soft">
                {new Date(entry.at).toLocaleString("pt-BR")}
              </time>
            </div>
            <p className="mt-1 text-ink-soft">{entry.detail}</p>
            <p className="mt-1 text-xs text-ink-soft">{entry.actor}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
