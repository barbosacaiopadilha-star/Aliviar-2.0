"use client";

import { useState } from "react";

import { registrarFeedbackPaciente } from "@/quality-layer/api/quality-client";

export function PortalFeedbackSection({ jornadaId }: { jornadaId: string }) {
  const [satisfacao, setSatisfacao] = useState(4);
  const [clareza, setClareza] = useState(4);
  const [facilidade, setFacilidade] = useState(4);
  const [comentarios, setComentarios] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await registrarFeedbackPaciente({
        jornada_id: jornadaId,
        satisfacao_geral: satisfacao,
        clareza_informacoes: clareza,
        facilidade_uso: facilidade,
        comentarios: comentarios.trim() || undefined,
      });
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <section className="card p-5" data-testid="portal-feedback-enviado">
        <p className="text-sm text-ink-soft">Obrigado pelo seu feedback. Ele nos ajuda a melhorar a operação.</p>
      </section>
    );
  }

  return (
    <section className="card p-5" data-testid="portal-feedback">
      <h2 className="font-medium text-ink">Seu feedback</h2>
      <p className="mt-1 text-xs text-ink-soft">Associado à sua jornada — sem decisão clínica.</p>
      <div className="mt-4 space-y-3 text-sm">
        <label className="block">
          Satisfação geral ({satisfacao})
          <input
            type="range"
            min={1}
            max={5}
            value={satisfacao}
            onChange={(e) => setSatisfacao(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          Clareza das informações ({clareza})
          <input
            type="range"
            min={1}
            max={5}
            value={clareza}
            onChange={(e) => setClareza(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          Facilidade de uso ({facilidade})
          <input
            type="range"
            min={1}
            max={5}
            value={facilidade}
            onChange={(e) => setFacilidade(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <textarea
          className="w-full rounded-lg border border-line px-3 py-2"
          rows={3}
          placeholder="Comentários livres (opcional)"
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
        />
      </div>
      <button type="button" className="btn-primary mt-3" disabled={loading} onClick={() => void handleSubmit()}>
        Enviar feedback
      </button>
    </section>
  );
}
