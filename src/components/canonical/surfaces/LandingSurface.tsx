import Link from "next/link";

import type { LandingExperienceModel } from "@/experience-layer/contracts/experience-models";

interface LandingSurfaceProps {
  model: LandingExperienceModel;
}

export function LandingSurface({ model }: LandingSurfaceProps) {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
        <header className="space-y-4" data-testid="landing-surface">
          <p className="text-sm font-medium uppercase tracking-wide text-sage">Aliviar</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">
            {model.promessa}
          </h1>
          <p className="text-lg text-ink-soft">{model.proximo_passo.descricao}</p>
        </header>

        <section className="mt-12 space-y-4" aria-label="Por que confiar">
          {model.conteudos_confianca.map((conteudo) => (
            <article key={conteudo.titulo} className="card p-5">
              <h2 className="font-medium text-ink">{conteudo.titulo}</h2>
              <p className="mt-2 text-sm text-ink-soft">{conteudo.descricao}</p>
            </article>
          ))}
        </section>

        <div className="mt-auto space-y-6 pt-16">
          <div className="card p-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              {model.convite_contato.titulo}
            </h2>
            <p className="mt-2 text-ink-soft">{model.convite_contato.descricao}</p>
            <Link href="/portal/entrar" className="btn-primary mt-6" data-testid="landing-cta">
              {model.convite_contato.acao}
            </Link>
          </div>

          <footer className="text-center">
            <Link href="/login" className="text-sm text-ink-soft underline">
              Equipe Aliviar
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
