"use client";

import { curadorPost } from "@/curator-layer/api/curador-client";
import type { CasoCuradorExperienceModel } from "@/curator-layer/resolve-curator-experience";
import type { EntregaDetalheView } from "@/experience-flow/contracts/jornada-view";

function EntregaPreview({ entrega, modo }: { entrega: EntregaDetalheView; modo: string }) {
  return (
    <div data-testid="entrega-preview-curador" data-modo={modo}>
      <p className="mb-4 text-sm text-ink-soft">
        Visualização idêntica à que o paciente receberá. Modo: {modo}.
      </p>
      <div className="space-y-4">
        {entrega.opcoes.map((opcao) => (
          <article key={opcao.indice} className="card p-5">
            <h3 className="font-medium text-ink">
              {opcao.nome} — {opcao.especialidade}
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>Por que está aqui:</strong> {opcao.por_que_esta_aqui}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>Por que pode fazer sentido:</strong> {opcao.por_que_pode_fazer_sentido}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>O que esperar:</strong> {opcao.o_que_esperar}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>Limitações:</strong> {opcao.limitacoes}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>Evidências:</strong> {opcao.evidencias_resumo}
            </p>
          </article>
        ))}
      </div>
      {entrega.comparativo.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 font-serif text-xl font-semibold text-ink">Comparativo</h2>
          {entrega.comparativo.map((item) => (
            <article key={item.dimensao} className="card mb-3 p-4">
              <h3 className="font-medium text-ink">{item.dimensao}</h3>
              <p className="mt-2 text-sm text-ink-soft">{item.narrativa}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}

export function EntregaCuradorSurface({
  model,
  onAction,
}: {
  model: CasoCuradorExperienceModel;
  onAction: () => Promise<void>;
}) {
  const entrega = model.caso.rascunho_entrega?.entrega;
  if (!entrega) {
    return <p className="text-ink-soft">Nenhuma entrega registrada ainda.</p>;
  }

  const modo = model.caso.rascunho_entrega?.modo ?? "RASCUNHO";
  const base = `/api/v1/curador/casos/${model.caso.jornada_id}/entrega`;

  async function handleAprovar() {
    await curadorPost(`${base}/aprovar`);
    await onAction();
  }

  async function handlePublicar() {
    await curadorPost(`${base}/publicar`);
    await onAction();
  }

  return (
    <div className="space-y-6" data-testid="entrega-curador-surface">
      <EntregaPreview entrega={entrega} modo={modo} />
      {model.pode_aprovar_entrega ? (
        <button type="button" className="btn-secondary" onClick={() => void handleAprovar()}>
          Aprovar entrega (modo revisão → aprovação)
        </button>
      ) : null}
      {model.pode_publicar_entrega ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => void handlePublicar()}
          data-testid="publicar-entrega"
        >
          Publicar para o paciente
        </button>
      ) : null}
    </div>
  );
}
