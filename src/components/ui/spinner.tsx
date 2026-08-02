import { cn } from "@/components/ui/cn";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

export function Spinner({ size = "md", label = "Carregando", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-[color-mix(in_srgb,var(--color-brand-primary)_20%,transparent)] border-t-brand-primary motion-reduce:animate-none",
        sizeClasses[size],
        className,
      )}
    />
  );
}
