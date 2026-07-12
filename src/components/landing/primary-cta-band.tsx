import { ChevronDown } from "lucide-react";

import { SectionContainer } from "@/components/landing/section-container";

export function PrimaryCtaBand() {
  return (
    <SectionContainer className="py-8 lg:py-10">
      <div className="mx-auto flex max-w-reading flex-col items-center gap-2 text-center">
        <p className="font-serif text-xl text-brand-primary-deep lg:text-2xl">
          Existe uma forma organizada de tomar essa decisão.
        </p>
        <a
          href="#video-institucional"
          className="mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-muted transition-colors duration-fast ease-standard hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Veja como, em poucos minutos
          <ChevronDown className="size-4" aria-hidden="true" />
        </a>
      </div>
    </SectionContainer>
  );
}
