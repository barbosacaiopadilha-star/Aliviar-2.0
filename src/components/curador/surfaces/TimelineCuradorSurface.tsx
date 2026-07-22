"use client";

import { useState } from "react";

import { curadorPost } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";

export function TimelineCuradorSurface({
  model,
  onComment,
}: {
  model: CasoCuradorExperienceModel;
  onComment: () => Promise<void>;
}) {
  const [conteudo, setConteudo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleComment() {
    if (!conteudo.trim()) return;
    setLoading(true);
    try {
      await curadorPost(`/api/v1/curador/casos/${model.caso.jornada_id}/comentarios`, {
        conteudo,
      });
      setConteudo("");
      await onComment();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="timeline-curador-surface">
      <section aria-label="Linha do tempo operacional">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Timeline operacional</h2>
        <ol className="space-y-3">
          {model.caso.timeline_operacional.map((item) => (
            <li key={item.id} className="card p-4 text-sm" data-testid="timeline-item">
              <p className="font-medium text-ink">{item.titulo}</p>
              <p className="mt-1 text-ink-soft">{item.descricao}</p>
              <p className="mt-2 text-xs text-ink-soft">
                {new Date(item.ocorrido_em).toLocaleString("pt-BR")} — {item.tipo}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="font-medium text-ink">Novo comentário</h2>
        <textarea
          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
          rows={3}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          data-testid="comentario-input"
        />
        <button
          type="button"
          className="btn-primary mt-3"
          disabled={loading || !conteudo.trim()}
          onClick={() => void handleComment()}
        >
          Registrar comentário
        </button>
      </section>
    </div>
  );
}
