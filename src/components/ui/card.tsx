import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
};

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className, padding = "md", ...props }: CardProps) {
  return (
    <div
      // Sem sombra em repouso: profundidade significa exclusivamente
      // transitoriedade (R9). O cartão se separa do fundo por VALOR — papel
      // sobre superfície recuada — e não por elevação. Só o que é passageiro
      // (menu, gaveta, diálogo) se eleva.
      className={cn(
        "rounded-md border border-border bg-surface",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4 space-y-1", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-sans text-xl font-semibold text-ink", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-ink-muted", className)}>{children}</p>;
}
