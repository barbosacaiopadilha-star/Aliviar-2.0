import { cn } from "@/components/ui/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-sm bg-[color-mix(in_srgb,var(--color-border)_70%,transparent)] motion-reduce:animate-none",
        className,
      )}
    />
  );
}
