import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";
import type { AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

type LandingSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "linen" | "warm" | "white" | "forest";
  atmosphere?: AliviarSceneKey | null;
};

const variantClasses = {
  linen: "bg-[var(--landing-linen)] text-[var(--landing-ink)]",
  warm: "bg-[var(--landing-linen-warm)] text-[var(--landing-ink)]",
  white: "bg-[var(--color-bg-surface)]/90 text-[var(--landing-ink)]",
  forest: "landing-forest-band",
};

export function LandingSection({
  children,
  className,
  variant = "linen",
  atmosphere = null,
  ...props
}: LandingSectionProps) {
  return (
    <section className={cn("landing-section", variantClasses[variant], className)} {...props}>
      {atmosphere ? (
        <ImmersiveBackdrop
          scene={atmosphere}
          variant="landing-soft"
          imageOpacity={variant === "forest" ? 10 : 16}
        />
      ) : null}
      <div className="relative z-10 mx-auto max-w-content px-5 lg:px-10">{children}</div>
    </section>
  );
}

export function LandingEyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span className={cn("landing-eyebrow", dark && "text-[var(--landing-linen)]/75")}>
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
