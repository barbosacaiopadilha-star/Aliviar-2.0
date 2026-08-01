import { cn } from "@/components/ui/cn";

type BadgeProps = {
  children: string;
  variant?: "default" | "sage" | "gold";
  className?: string;
};

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-canvas text-ink border-border",
  sage: "bg-brand-sage-light/40 text-ink border-brand-sage/30",
  gold: "bg-canvas text-ink border-brand-gold/40",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium tracking-[0.01em]",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
