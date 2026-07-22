"use client";

import type { ChecklistItemState, StudioChecklistItem } from "@/alicia/studio/types";

import { useStudio } from "./StudioProvider";

const STATE_CYCLE: ChecklistItemState[] = [
  "pendente",
  "em_andamento",
  "concluido",
  "bloqueado",
];

const STATE_LABELS: Record<ChecklistItemState, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  bloqueado: "Bloqueado",
};

const STATE_ICONS: Record<ChecklistItemState, string> = {
  pendente: "□",
  em_andamento: "◐",
  concluido: "✓",
  bloqueado: "🚫",
};

function nextState(current: ChecklistItemState): ChecklistItemState {
  const index = STATE_CYCLE.indexOf(current);
  return STATE_CYCLE[(index + 1) % STATE_CYCLE.length]!;
}

function groupBySection(items: StudioChecklistItem[]): Map<string, StudioChecklistItem[]> {
  const groups = new Map<string, StudioChecklistItem[]>();
  for (const item of items) {
    const list = groups.get(item.section) ?? [];
    list.push(item);
    groups.set(item.section, list);
  }
  return groups;
}

export function OperationalChecklist({ candidateId }: { candidateId: string }) {
  const { getCandidateById, setChecklistItem } = useStudio();
  const candidate = getCandidateById(candidateId);

  if (!candidate) {
    return null;
  }

  const groups = groupBySection(candidate.checklist);

  return (
    <section className="card p-6" data-testid="studio-checklist">
      <h2 className="text-sm font-semibold text-ink">Checklist operacional</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Protocolo AliCIA 1.0 — Capítulo 12. Clique para alternar estado.
      </p>

      <div className="mt-6 space-y-6">
        {[...groups.entries()].map(([section, items]) => (
          <div key={section}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {section}
            </h3>
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setChecklistItem(candidateId, item.id, nextState(item.state))}
                    className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-paper"
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-center text-sm" aria-hidden>
                      {STATE_ICONS[item.state]}
                    </span>
                    <span className="flex-1">
                      <span className="text-sm text-ink">
                        <span className="font-mono text-xs text-ink-soft">{item.id}</span>{" "}
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">
                        {STATE_LABELS[item.state]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
