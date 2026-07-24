import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

export function KpiCard({ label, value, hint, href, className }: KpiCardProps) {
  const content = (
    <Card
      padding="lg"
      className={cn(
        "h-full transition-shadow duration-fast ease-standard motion-reduce:transition-none",
        href && "hover:shadow-md",
        className,
      )}
    >
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-brand-primary-deep">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
        {content}
      </Link>
    );
  }

  return content;
}
