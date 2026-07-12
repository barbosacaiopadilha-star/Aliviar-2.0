import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Checkbox({ id, label, className, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink",
        className,
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="size-4 rounded-sm border-border text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
