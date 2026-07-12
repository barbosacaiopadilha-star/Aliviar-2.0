"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";

type MenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
};

type DropdownMenuProps = {
  triggerLabel: string;
  items: MenuItem[];
  className?: string;
};

export function DropdownMenu({ triggerLabel, items, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {triggerLabel}
        <ChevronDown className="size-4 text-ink-muted" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 z-dropdown mt-2 min-w-44 rounded-md border border-border bg-surface py-1 shadow-md"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              {item.href ? (
                <a
                  href={item.href}
                  role="menuitem"
                  className="block px-3 py-2 text-sm text-ink hover:bg-canvas"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-canvas"
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
