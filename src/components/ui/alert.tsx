import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type AlertProps = {
  variant: "success" | "warning" | "error" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<AlertProps["variant"], string> = {
  success: "border-success/20 bg-success-surface text-success",
  warning: "border-warning/20 bg-warning-surface text-warning",
  error: "border-error/20 bg-error-surface text-error",
  info: "border-border bg-canvas text-ink",
};

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  info: Info,
};

export function Alert({ variant, title, children, className }: AlertProps) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-md border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="text-current/90">{children}</div>
      </div>
    </div>
  );
}
