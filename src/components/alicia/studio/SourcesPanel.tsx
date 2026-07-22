"use client";

import { useState } from "react";

import type { StudioSource } from "@/alicia/studio/types";

import { useStudio } from "./StudioProvider";

const EMPTY_FORM = {
  name: "",
  type: "Instituição",
  url: "",
  consultedAt: new Date().toISOString().slice(0, 10),
  responsible: "Operador AliCIA",
};

export function SourcesPanel({ candidateId }: { candidateId: string }) {
  const { getCandidateById, addCandidateSource, editCandidateSource, deleteCandidateSource, state } =
    useStudio();
  const candidate = getCandidateById(candidateId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!candidate) {
    return null;
  }

  function startEdit(source: StudioSource) {
    setEditingId(source.id);
    setForm({
      name: source.name,
      type: source.type,
      url: source.url ?? "",
      consultedAt: source.consultedAt,
      responsible: source.responsible,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, responsible: state.defaultActor });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type.trim(),
      url: form.url.trim() || undefined,
      consultedAt: form.consultedAt,
      responsible: form.responsible.trim() || state.defaultActor,
    };

    if (editingId) {
      editCandidateSource(candidateId, editingId, payload);
    } else {
      addCandidateSource(candidateId, payload);
    }
    resetForm();
  }

  return (
    <section className="card p-6" data-testid="studio-sources">
      <h2 className="text-sm font-semibold text-ink">Fontes</h2>
      <p className="mt-1 text-xs text-ink-soft">
        {candidate.sources.length} fonte(s) registrada(s)
      </p>

      <ul className="mt-4 space-y-3">
        {candidate.sources.length === 0 ? (
          <li className="text-sm text-ink-soft">Nenhuma fonte registrada.</li>
        ) : (
          candidate.sources.map((source) => (
            <li
              key={source.id}
              className="rounded-lg border border-line bg-paper px-3 py-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{source.name}</p>
                  <p className="text-xs text-ink-soft">{source.type}</p>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs text-coral hover:underline"
                    >
                      {source.url}
                    </a>
                  )}
                  <p className="mt-1 text-xs text-ink-soft">
                    {source.consultedAt} · {source.responsible}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => startEdit(source)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2 py-1 text-xs text-coral"
                    onClick={() => deleteCandidateSource(candidateId, source.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {editingId ? "Editar fonte" : "Adicionar fonte"}
        </h3>
        <input
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
          placeholder="Nome da fonte"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
          placeholder="Tipo (ex.: Registro profissional)"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          required
        />
        <input
          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
          placeholder="URL (opcional)"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
            value={form.consultedAt}
            onChange={(e) => setForm((f) => ({ ...f, consultedAt: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
            placeholder="Responsável"
            value={form.responsible}
            onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
            required
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm">
            {editingId ? "Salvar alterações" : "Adicionar fonte"}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary text-sm" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
