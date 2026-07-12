import { cn } from "@/components/ui/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-sm bg-border/70 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
