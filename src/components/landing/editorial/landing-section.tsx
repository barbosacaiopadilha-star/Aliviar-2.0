import type { HTMLAttributes, ReactNode } from "react";

import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";
import type { AliviarSceneKey } from "@/lib/aliviar-environments";
import { cn } from "@/components/ui/cn";

type LandingSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  variant?: "linen" | "white" | "forest";
  atmosphere?: AliviarSceneKey | null;
};

const variantClasses = {
  linen: "bg-[var(--landing-linen)] text-[var(--landing-ink)]",
  white: "bg-white/80 text-[var(--landing-ink)]",
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
          imageOpacity={variant === "forest" ? 12 : 18}
        />
      ) : null}
      <div className="relative z-10 mx-auto max-w-content px-4 lg:px-8">{children}</div>
    </section>
  );
}

export function LandingEyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        "mb-4 inline-block text-xs font-semibold uppercase tracking-[0.16em]",
        dark ? "text-[var(--landing-linen)]/80" : "text-[var(--color-brand-sage)]",
      )}
    >
      {children}
    </span>
  );
}

export function LandingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("landing-card p-6 lg:p-8", className)}>{children}</div>;
}
