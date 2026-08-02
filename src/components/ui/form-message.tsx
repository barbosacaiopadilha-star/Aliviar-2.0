import { cn } from "@/components/ui/cn";

type FormMessageProps = {
  variant: "error" | "success" | "warning";
  children: string;
  className?: string;
};

const variantClasses: Record<FormMessageProps["variant"], string> = {
  error: "border-[color-mix(in_srgb,var(--color-error)_20%,transparent)] bg-error-surface text-error",
  success: "border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] bg-success-surface text-success",
  warning: "border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] bg-warning-surface text-warning",
};

export function FormMessage({ variant, children, className }: FormMessageProps) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}
