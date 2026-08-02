import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type StatusBannerVariant = "success" | "error" | "info" | "warning";

type StatusBannerProps = {
  variant?: StatusBannerVariant;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<StatusBannerVariant, string> = {
  success: "border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] bg-success-surface text-success",
  error: "border-[color-mix(in_srgb,var(--color-error)_20%,transparent)] bg-error-surface text-error",
  info: "border-border bg-canvas text-ink-muted",
  warning: "border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] bg-warning-surface text-warning",
};

const icons: Record<StatusBannerVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

export function StatusBanner({ variant = "info", children, className }: StatusBannerProps) {
  const Icon = icons[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-md border px-4 py-3 text-sm transition-opacity duration-fast ease-standard",
        variantStyles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
