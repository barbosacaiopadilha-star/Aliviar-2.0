import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";

// LANDING 2.0 — PRESENÇA (MISSÃO 201, ADR-033)
//
// Portal do Paciente → Quem somos.
// O Portal é apresentado como continuação da jornada, nunca como "outro
// sistema" (MISSÃO 201: "Já iniciou sua Curadoria? Acesse sua Jornada").
// Quem somos: autoridade pelo limite declarado — dizer o que a Aliviar não
// faz comunica mais confiança do que qualquer credencial empilhada
// (Experience Bible §2.1; LANDING_EXPERIENCE_PHILOSOPHY §3.6). Nenhum nome,
// número ou credencial fabricada — nenhum dado fictício como real.

// ---------------------------------------------------------------------------
// 9. Portal do Paciente
// ---------------------------------------------------------------------------

export function PortalPacienteSection() {
  return (
    <SectionContainer className="bg-canvas">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionReveal className="max-w-reading space-y-4">
            <SectionEyebrow align="left">Sua Jornada</SectionEyebrow>
            <h2 className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
              Entre uma conversa e outra, você nunca fica no escuro.
            </h2>
            <p className="text-base leading-relaxed text-ink-muted">
              Sua Jornada é o espaço onde você acompanha a própria Curadoria: quem está cuidando do
              seu caso, em que ponto ele está e quando você terá notícia. Sempre com nome, sempre com
              data — nunca um &ldquo;processando&rdquo;.
            </p>
            <p className="text-base leading-relaxed text-ink-muted">
              É lá que ficam suas prioridades confirmadas, o Relatório depois da conversa, e a sua
              decisão registrada.
            </p>
            <div className="pt-2">
              <p className="text-sm font-medium text-ink">Já iniciou sua Curadoria?</p>
              <LinkButton href="/login" variant="secondary" className="mt-3">
                Acessar minha Jornada
              </LinkButton>
            </div>
          </SectionReveal>

          <SectionReveal delayMs={100}>
            {/* Ilustração do estado real que a Jornada mostra — declaradamente
                um exemplo, com os três compromissos: quem, o quê, quando. */}
            <div className="rounded-lg border border-border bg-surface p-6 lg:p-8">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                O que você vê por lá
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-md bg-canvas p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Quem</p>
                  <p className="mt-1 text-sm text-ink">
                    Sua Curadora está com o seu caso — pelo nome, do início ao fim.
                  </p>
                </div>
                <div className="rounded-md bg-canvas p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">O quê</p>
                  <p className="mt-1 text-sm text-ink">
                    Em que ponto sua Curadoria está, em linguagem de gente.
                  </p>
                </div>
                <div className="rounded-md bg-canvas p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Quando</p>
                  <p className="mt-1 text-sm text-ink">
                    A data combinada para o seu retorno — e, se mudar, você fica sabendo antes.
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </SectionContainer>
  );
}

// ---------------------------------------------------------------------------
// 10. Quem somos
// ---------------------------------------------------------------------------

export function QuemSomosSection() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto max-w-content px-4 lg:px-8">
        <SectionReveal className="max-w-reading space-y-4">
          <SectionEyebrow>Quem somos</SectionEyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
            Uma equipe de Curadores — e um compromisso que não se negocia.
          </h2>
          <p className="text-base leading-relaxed text-ink-muted">
            A Aliviar é formada por pessoas cujo trabalho é conduzir decisões de saúde com método,
            calma e critério. Os médicos que apresentamos passam por aprovação própria da Aliviar —
            anterior e independente de qualquer paciente. Nenhum médico paga para estar aqui, para
            ser analisado ou para ser apresentado.
          </p>
        </SectionReveal>

        <SectionReveal delayMs={100} className="mt-10 rounded-lg border border-brand-gold/40 bg-canvas p-6 lg:p-8">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-brand-primary-deep">
            O que nós não fazemos
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                "Não damos diagnóstico nem opinião clínica — isso pertence ao médico.",
                "Não escolhemos por você — apresentamos três caminhos e a decisão é sua.",
                "Não vendemos posição — recomendação aqui nunca é anúncio.",
                "Não prometemos resultado clínico — prometemos um processo sério.",
              ] as const
            ).map((line) => (
              <li key={line} className="flex items-baseline gap-3">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-gold" />
                <p className="text-sm leading-relaxed text-ink">{line}</p>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </div>
    </SectionContainer>
  );
}
