import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";

export function ConciergeSection() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto flex max-w-reading flex-col items-center gap-4 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage">
          Outra forma de começar
        </span>
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          Prefere ser guiado desde a primeira conversa?
        </h2>
        <p className="text-base text-ink-muted">
          É a mesma curadoria Aliviar — só que, desde o início, alguém da nossa equipe conduz
          cada passo com você, sem que você precise organizar nada sozinho. O site continua com
          você o tempo todo, mesmo quando a conversa acontece por WhatsApp.
        </p>
        <LinkButton href="/sua-historia" variant="secondary">
          Pedir esse tipo de acompanhamento
        </LinkButton>
      </div>
    </SectionContainer>
  );
}
