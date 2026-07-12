import { cn } from "@/components/ui/cn";

type FormMessageProps = {
  variant: "error" | "success" | "warning";
  children: string;
  className?: string;
};

const variantClasses: Record<FormMessageProps["variant"], string> = {
  error: "border-error/20 bg-error-surface text-error",
  success: "border-success/20 bg-success-surface text-success",
  warning: "border-warning/20 bg-warning-surface text-warning",
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
