import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type AlertProps = {
  variant: "success" | "warning" | "error" | "info" | "attention";
  title?: string;
  children: ReactNode;
  className?: string;
};

// `attention` (argila) é a variante das superfícies da pessoa atendida: uma
// condição a conversar, nunca uma falha dela. As três operacionais existiam
// antes desta mudança e continuam restritas aos fundos — sua unificação sob
// a gramática de quatro papéis já está registrada como dívida técnica
// separada na auditoria, e não é reaberta aqui.
const variantClasses: Record<AlertProps["variant"], string> = {
  success: "border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] bg-success-surface text-success",
  warning: "border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] bg-warning-surface text-warning",
  error: "border-[color-mix(in_srgb,var(--color-error)_20%,transparent)] bg-error-surface text-error",
  info: "border-border bg-recessed text-ink",
  attention: "border-[color-mix(in_srgb,var(--color-attention)_20%,transparent)] bg-attention-surface text-attention",
};

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  info: Info,
  attention: Info,
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
