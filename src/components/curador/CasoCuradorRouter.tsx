"use client";

import Link from "next/link";

import { useCurator } from "@/components/curador/CuratorProvider";
import { EntregaCuradorSurface } from "@/components/curador/surfaces/EntregaCuradorSurface";
import { OpcoesCuradorSurface } from "@/components/curador/surfaces/OpcoesCuradorSurface";
import { TimelineCuradorSurface } from "@/components/curador/surfaces/TimelineCuradorSurface";
import { WorkspaceCuradorSurface } from "@/components/curador/surfaces/WorkspaceCuradorSurface";
import { resolveCuratorCaseSurface } from "@/curator-layer/resolve-curator-experience";

export function CasoCuradorRouter() {
  const { loadState, refresh } = useCurator();

  if (loadState.status === "loading") {
    return <p className="text-ink-soft">Carregando caso...</p>;
  }

  if (loadState.status === "error") {
    return <p className="text-coral">{loadState.message}</p>;
  }

  const model = loadState.snapshot.caso;
  if (!model) {
    return null;
  }

  const surface = resolveCuratorCaseSurface(model.caso);

  return (
    <div className="space-y-8" data-testid="caso-curador-router">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">{model.caso.paciente_nome}</h1>
          <p className="text-sm text-ink-soft">
            {model.caso.titulo_jornada} — {model.estado_label}
          </p>
        </div>
        <Link href="/curador" className="btn-secondary">
          Voltar à fila
        </Link>
      </div>

      <section className="card p-5" data-testid="caso-resumo">
        <h2 className="font-medium text-ink">História e contexto</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Etapa: {model.caso.jornada.etapa_atual} — {model.caso.jornada.estado_visivel}
        </p>
        {model.caso.bloqueio ? (
          <p className="mt-2 text-sm text-coral">Bloqueio: {model.caso.bloqueio.motivo_humano}</p>
        ) : null}
        <p className="mt-2 text-sm text-ink-soft">
          Responsável: {model.caso.responsavel.nome_exibicao ?? model.caso.responsavel.tipo}
        </p>
        {model.caso.documentos.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            {model.caso.documentos.map((doc) => (
              <li key={doc.id}>
                {doc.nome_arquivo} — {doc.status}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {surface === "workspace" ? (
        <WorkspaceCuradorSurface model={model} onAction={refresh} />
      ) : null}
      {surface === "opcoes" ? (
        <OpcoesCuradorSurface model={model} onSaved={refresh} />
      ) : null}
      {surface === "entrega" ? <EntregaCuradorSurface model={model} onAction={refresh} /> : null}

      <TimelineCuradorSurface model={model} onComment={refresh} />
    </div>
  );
}
