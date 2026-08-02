"use client";

import { useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";

type ToastItem = {
  id: string;
  message: string;
  variant?: "success" | "warning" | "error" | "info";
};

const variantClasses: Record<NonNullable<ToastItem["variant"]>, string> = {
  success: "border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] bg-success-surface text-success",
  warning: "border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] bg-warning-surface text-warning",
  error: "border-[color-mix(in_srgb,var(--color-error)_20%,transparent)] bg-error-surface text-error",
  info: "border-border bg-surface text-ink",
};

let pushToast: ((toast: Omit<ToastItem, "id">) => void) | null = null;

export function showToast(toast: Omit<ToastItem, "id">) {
  pushToast?.(toast);
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushToast = (toast) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    };

    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "rounded-md border px-4 py-3 text-sm shadow-md",
            variantClasses[toast.variant ?? "success"],
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
