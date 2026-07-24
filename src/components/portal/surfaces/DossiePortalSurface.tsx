"use client";

import { NextStepCard } from "@/components/canonical";
import type { DossieExperienceModel } from "@/experience-layer/contracts/experience-models";

interface DossiePortalSurfaceProps {
  model: DossieExperienceModel;
}

export function DossiePortalSurface({ model }: DossiePortalSurfaceProps) {
  return (
    <div data-testid="dossie-portal-surface" className="space-y-6">
      <section className="card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage">Dossiê</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">Dossiê disponível</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Versão {model.versao} — publicado em{" "}
          {new Date(model.publicado_em).toLocaleDateString("pt-BR")}
        </p>
      </section>

      <section className="card p-5" data-testid="perfil-prioridades-portal">
        <h2 className="font-medium text-ink">Suas prioridades</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Dimensões validadas pelo curador — sem ranking entre opções.
        </p>
        <ul className="mt-4 space-y-3">
          {model.perfil_prioridades.dimensoes.map((dim) => (
            <li key={dim.nome} className="text-sm text-ink-soft">
              <span className="font-medium text-ink">{dim.nome}</span>
              {dim.descricao ? ` — ${dim.descricao}` : null}
              {model.perfil_prioridades.pesos[dim.nome] !== undefined ? (
                <span className="ml-2 text-ink-soft">
                  (peso {model.perfil_prioridades.pesos[dim.nome]})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Opções do dossiê">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Três caminhos possíveis</h2>
        <p className="mb-6 text-sm text-ink-soft">
          Cada opção com parecer, pontos favoráveis, atenção e perguntas sugeridas — sem vencedor
          nem ranking.
        </p>
        <div className="space-y-4">
          {model.opcoes.map((opcao) => (
            <article key={opcao.rotulo} className="card p-5" data-testid={`opcao-${opcao.rotulo}`}>
              <h3 className="font-medium text-ink">
                Opção {opcao.rotulo}: {opcao.nome} — {opcao.especialidade}
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                <strong>Parecer:</strong> {opcao.parecer}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                <strong>Pontos favoráveis:</strong> {opcao.pontos_favoraveis}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                <strong>Pontos de atenção:</strong> {opcao.pontos_atencao}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                <strong>Perguntas sugeridas:</strong> {opcao.perguntas_sugeridas}
              </p>
            </article>
          ))}
        </div>
      </section>

      <NextStepCard proximo_passo={model.proximo_passo} />
    </div>
  );
}
