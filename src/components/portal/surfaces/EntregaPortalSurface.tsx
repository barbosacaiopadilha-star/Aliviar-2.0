"use client";

import { postApiCommand } from "@/experience-layer/api/jornada-client";
import type { EntregaExperienceModel } from "@/experience-layer/contracts/experience-models";
import { NextStepCard } from "@/components/canonical";

interface EntregaPortalSurfaceProps {
  model: EntregaExperienceModel;
  onAdvanced?: () => Promise<void>;
}

export function EntregaPortalSurface({ model, onAdvanced }: EntregaPortalSurfaceProps) {
  async function handleProceed() {
    if (!onAdvanced) return;
    await postApiCommand("/api/v1/me/entrega/avancar");
    await onAdvanced();
  }

  return (
    <div data-testid="entrega-portal-surface" className="space-y-6">
      <NextStepCard proximo_passo={model.proximo_passo} />

      <section aria-label="Opções de profissionais">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Três caminhos possíveis</h2>
        <p className="mb-6 text-sm text-ink-soft">
          Sem ranking nem score — cada opção com sua narrativa.
        </p>
        <div className="space-y-4">
          {model.entrega.opcoes.map((opcao) => (
            <article key={opcao.indice} className="card p-5" data-testid={`opcao-${opcao.indice}`}>
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
      </section>

      {model.entrega.comparativo.length > 0 ? (
        <section aria-label="Comparativo narrativo">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Comparativo</h2>
          {model.entrega.comparativo.map((item) => (
            <article key={item.dimensao} className="card mb-3 p-4">
              <h3 className="font-medium text-ink">{item.dimensao}</h3>
              <p className="mt-2 text-sm text-ink-soft">{item.narrativa}</p>
            </article>
          ))}
        </section>
      ) : null}

      {onAdvanced ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => void handleProceed()}
          data-testid="entrega-avancar"
        >
          Prosseguir para escolha
        </button>
      ) : null}
    </div>
  );
}
