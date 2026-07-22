"use client";

import Link from "next/link";

import { StoryReveal } from "./StoryReveal";
import { WelcomeLetter } from "./WelcomeLetter";

export function ChapterOneExperience() {
  return (
    <div className="chapter-one">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
        <div className="chapter-one__glow chapter-one__glow--sage" />
      </div>

      <main className="chapter-one__main">
        <WelcomeLetter />

        <div className="chapter-one__scroll-hint chapter-one__scroll-hint--enter" aria-hidden="true">
          <span />
        </div>

        <section className="chapter-one__beats" aria-label="História">
          <StoryReveal>
            <p className="chapter-one__beat chapter-one__beat--lead">
              Quando a saúde fica complexa, o caminho cansa.
            </p>
          </StoryReveal>

          <StoryReveal delay={120}>
            <p className="chapter-one__beat">
              Diagnósticos, escolhas, esperas — muitas vezes tudo ao mesmo tempo.
            </p>
          </StoryReveal>

          <StoryReveal delay={80}>
            <p className="chapter-one__beat chapter-one__beat--emphasis">
              A Aliviar existe para coordenar essa experiência com você.
            </p>
          </StoryReveal>

          <StoryReveal delay={100}>
            <p className="chapter-one__beat">Com critério. Com presença. No seu ritmo.</p>
          </StoryReveal>

          <StoryReveal delay={80}>
            <div className="chapter-one__divider" aria-hidden="true" />
          </StoryReveal>

          <StoryReveal delay={60}>
            <p className="chapter-one__beat chapter-one__beat--soft">
              Não somos clínica. Não substituímos seu médico.
            </p>
          </StoryReveal>

          <StoryReveal delay={100}>
            <p className="chapter-one__beat">
              Somos quem organiza o caminho ao seu lado — entende o contexto, cuida da curadoria
              e acompanha a jornada.
            </p>
          </StoryReveal>
        </section>

        <section className="chapter-one__invitation" aria-label="Convite">
          <StoryReveal>
            <p className="chapter-one__invitation-text">
              Se fizer sentido para você, o próximo passo é simples: uma conversa.
            </p>
          </StoryReveal>

          <StoryReveal delay={160}>
            <div className="chapter-one__cta-wrap">
              <Link href="/comecar" className="chapter-one__cta">
                Iniciar conversa
              </Link>
              <p className="chapter-one__cta-note">Sem pressa. Sem formulário. Só o primeiro contato.</p>
            </div>
          </StoryReveal>
        </section>
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
