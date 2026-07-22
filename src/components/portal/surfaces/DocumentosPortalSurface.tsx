"use client";

import { useState } from "react";

import { NextStepCard } from "@/components/canonical";
import { postApiCommand } from "@/experience-layer/api/jornada-client";
import type { DocumentosExperienceModel } from "@/experience-layer/contracts/experience-models";

interface DocumentosPortalSurfaceProps {
  model: DocumentosExperienceModel;
  onUploaded: () => Promise<void>;
}

export function DocumentosPortalSurface({ model, onUploaded }: DocumentosPortalSurfaceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      await postApiCommand("/api/v1/me/documentos", {
        nome_arquivo: file.name,
        tipo_mime: file.type || "application/octet-stream",
        tamanho_bytes: file.size,
      });
      await onUploaded();
    } catch {
      setError("Não foi possível enviar o documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="documentos-portal-surface" className="space-y-6">
      <NextStepCard proximo_passo={model.proximo_passo} />

      <section className="card p-5">
        <h2 className="font-medium text-ink">Enviar documento</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Selecione o arquivo solicitado pela equipe.
        </p>
        <input
          type="file"
          className="mt-4 block w-full text-sm"
          onChange={(e) => void handleUpload(e)}
          disabled={loading}
          data-testid="documento-upload"
        />
      </section>

      {model.documentos.length > 0 ? (
        <section aria-label="Histórico de documentos">
          <h2 className="mb-3 font-serif text-xl font-semibold text-ink">Histórico</h2>
          <ul className="space-y-2">
            {model.documentos.map((doc) => (
              <li key={doc.id} className="card p-4 text-sm" data-testid="documento-item">
                <p className="font-medium text-ink">{doc.nome_arquivo}</p>
                <p className="text-ink-soft">
                  {doc.status} — {new Date(doc.recebido_em).toLocaleDateString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
