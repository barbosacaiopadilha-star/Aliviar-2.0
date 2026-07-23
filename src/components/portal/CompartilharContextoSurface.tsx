"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CompartilharContextoView } from "@/vertical-slice";

interface CompartilharContextoSurfaceProps {
  initialView: CompartilharContextoView;
  onShared: (view: CompartilharContextoView) => void;
}

export function CompartilharContextoSurface({ initialView, onShared }: CompartilharContextoSurfaceProps) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [observation, setObservation] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentWhere, setDocumentWhere] = useState("");
  const [referenceLabel, setReferenceLabel] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/me/compartilhar-contexto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observation: observation.trim() || null,
          document:
            documentName.trim() && documentWhere.trim()
              ? { name: documentName.trim(), where: documentWhere.trim() }
              : null,
          reference:
            referenceLabel.trim() && referenceUrl.trim()
              ? { label: referenceLabel.trim(), url: referenceUrl.trim() }
              : null,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Não foi possível compartilhar agora.");
      }

      const payload = (await response.json()) as {
        confirmationPath: string;
        view: CompartilharContextoView;
      };

      setView(payload.view);
      setObservation("");
      setDocumentName("");
      setDocumentWhere("");
      setReferenceLabel("");
      setReferenceUrl("");
      onShared(payload.view);
      router.push(payload.confirmationPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao compartilhar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper" data-testid="compartilhar-contexto">
      <div className="mx-auto max-w-xl space-y-10 px-6 py-16">
        <div className="space-y-3">
          <Link href="/portal" className="text-sm text-ink/50 hover:text-ink/70">
            ← Voltar
          </Link>
          <p className="text-lg leading-relaxed text-ink/75">{view.invitation}</p>
          <p className="text-base leading-relaxed text-ink/60">{view.reassurance}</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit} data-testid="share-context-form">
          <section className="space-y-3">
            <h2 className="text-sm text-ink/50">Observações</h2>
            <label className="block text-base text-ink/80" htmlFor="observation">
              Algo que ainda não ficou claro?
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-ink/15 bg-white/80 px-4 py-3 text-ink/90"
              placeholder="Conte com suas palavras..."
              data-testid="share-observation"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink/50">Documentos</h2>
            <p className="text-base text-ink/70">Mencione um documento que você já tem — não precisa enviar agora.</p>
            <input
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-white/80 px-4 py-3"
              placeholder="Nome do documento"
              data-testid="share-document-name"
            />
            <input
              value={documentWhere}
              onChange={(event) => setDocumentWhere(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-white/80 px-4 py-3"
              placeholder="Onde está (pasta, e-mail, outro lugar)"
              data-testid="share-document-where"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink/50">Referências</h2>
            <p className="text-base text-ink/70">Um link ou material que ajude a situar sua história.</p>
            <input
              value={referenceLabel}
              onChange={(event) => setReferenceLabel(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-white/80 px-4 py-3"
              placeholder="O que é essa referência"
              data-testid="share-reference-label"
            />
            <input
              value={referenceUrl}
              onChange={(event) => setReferenceUrl(event.target.value)}
              className="w-full rounded-lg border border-ink/15 bg-white/80 px-4 py-3"
              placeholder="Endereço ou localização"
              data-testid="share-reference-url"
            />
          </section>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full border border-ink/20 px-6 py-3 text-base text-ink/85 transition hover:border-ink/40"
            data-testid="share-submit"
          >
            {submitting ? "Um momento..." : "Compartilhar com a equipe"}
          </button>
        </form>

        {view.organizacao.length > 0 ? (
          <section className="space-y-6 border-t border-ink/10 pt-8" data-testid="share-organization">
            <h2 className="text-sm text-ink/50">Organização</h2>
            {view.organizacao.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-base text-ink/80">{group.title}</h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="rounded-lg bg-white/50 px-4 py-3 text-ink/75">
                      <p className="font-medium">{item.label}</p>
                      {item.detail ? <p className="text-sm text-ink/60">{item.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null}

        {view.historico.length > 0 ? (
          <section className="space-y-4 border-t border-ink/10 pt-8" data-testid="share-history">
            <h2 className="text-sm text-ink/50">Histórico</h2>
            <ul className="space-y-2">
              {view.historico.map((entry) => (
                <li key={entry.id} className="text-sm text-ink/65">
                  {entry.headline}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
