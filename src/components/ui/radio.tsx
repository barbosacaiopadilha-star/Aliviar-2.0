import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type RadioProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Radio({ id, label, className, ...props }: RadioProps) {
  const radioId = id ?? props.name;

  return (
    <label
      htmlFor={radioId}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink",
        className,
      )}
    >
      <input
        id={radioId}
        type="radio"
        className="size-4 border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
