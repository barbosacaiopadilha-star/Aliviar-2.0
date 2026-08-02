import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function SearchField({
  label = "Buscar",
  className,
  id = "search",
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        placeholder={label}
        className="block min-h-11 w-full rounded-sm border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink transition-colors duration-fast ease-standard placeholder:text-ink-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-focus-ring)_20%,transparent)]"
        {...props}
      />
    </div>
  );
}
