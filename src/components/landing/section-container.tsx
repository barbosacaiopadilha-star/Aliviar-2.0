import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type SectionContainerProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function SectionContainer({ children, className, ...props }: SectionContainerProps) {
  return (
    <section className={cn("px-4 py-12 lg:px-8 lg:py-20", className)} {...props}>
      <div className="mx-auto w-full max-w-content">{children}</div>
    </section>
  );
}
