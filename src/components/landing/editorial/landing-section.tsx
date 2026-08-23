import type { CSSProperties, ComponentProps, HTMLAttributes, ReactNode } from "react";

import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";
import type { AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

type LandingSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "linen" | "warm" | "white" | "forest";
  atmosphere?: AliviarSceneKey | null;
  /**
   * ADR-080 · curva de intensidade do Edifício: quando presentes, controlam
   * o quão expressivo o ambiente fica atrás do conteúdo. Sem eles, vale o
   * comportamento histórico (landing-soft, opacidade 16/10).
   */
  atmosphereVariant?: ComponentProps<typeof ImmersiveBackdrop>["variant"];
  atmosphereOpacity?: number;
  /**
   * A batida da seção no ritmo da página (CRITICA_LANDING_2_2 §3): antes
   * todas as seções tinham o MESMO respiro (8,5–12rem), e respiro uniforme
   * é um metrônomo — o olho desliza em vez de ser conduzido. `ampla` é a
   * contemplação, `media` a leitura, `densa` a explicação, `respiro` a
   * pausa deliberada entre atos.
   */
  spacing?: "ampla" | "media" | "densa" | "respiro";
};

const variantClasses = {
  linen: "bg-[var(--landing-linen)] text-[var(--landing-ink)]",
  warm: "bg-[var(--landing-linen-warm)] text-[var(--landing-ink)]",
  white: "bg-[color-mix(in_srgb,var(--color-bg-surface)_90%,transparent)] text-[var(--landing-ink)]",
  forest: "landing-forest-band",
};

const spacingClasses = {
  ampla: "",
  media: "landing-section--media",
  densa: "landing-section--densa",
  respiro: "landing-section--respiro",
};

export function LandingSection({
  children,
  className,
  variant = "linen",
  atmosphere = null,
  atmosphereVariant,
  atmosphereOpacity,
  spacing = "ampla",
  ...props
}: LandingSectionProps) {
  return (
    <section
      className={cn("landing-section", variantClasses[variant], spacingClasses[spacing], className)}
      {...props}
    >
      {atmosphere ? (
        <ImmersiveBackdrop
          scene={atmosphere}
          variant={atmosphereVariant ?? "landing-soft"}
          imageOpacity={atmosphereOpacity ?? (variant === "forest" ? 10 : 16)}
        />
      ) : null}
      <div className="relative z-10 mx-auto max-w-content px-5 lg:px-10">{children}</div>
    </section>
  );
}

export function LandingEyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span className={cn("landing-eyebrow", dark && "text-on-dark-muted")}>
      {children}
    </span>
  );
}

export function LandingCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("landing-card p-7 lg:p-10", className)} style={style}>
      {children}
    </div>
  );
}
