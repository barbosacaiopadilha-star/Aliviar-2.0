import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

export function ConciergeSection() {
  return (
    <SectionContainer>
      <SectionReveal className="mx-auto grid max-w-content gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
        <div className="text-center lg:text-left">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage">
            Outra forma de começar
          </span>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
            Prefere ser guiado desde a primeira conversa?
          </h2>
          <p className="mt-3 max-w-reading text-base text-ink-muted lg:mx-0">
            É a mesma curadoria Aliviar — só que, desde o início, alguém da nossa equipe conduz
            cada passo com você, sem que você precise organizar nada sozinho. O site continua com
            você o tempo todo, mesmo quando a conversa acontece por WhatsApp.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <LinkButton href="/sua-historia" variant="secondary">
            Pedir esse tipo de acompanhamento
          </LinkButton>
        </div>
      </SectionReveal>
    </SectionContainer>
  );
}
