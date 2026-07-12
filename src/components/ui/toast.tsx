"use client";

import { useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";

type ToastItem = {
  id: string;
  message: string;
  variant?: "success" | "warning" | "error";
};

const variantClasses: Record<NonNullable<ToastItem["variant"]>, string> = {
  success: "border-success/20 bg-success-surface text-success",
  warning: "border-warning/20 bg-warning-surface text-warning",
  error: "border-error/20 bg-error-surface text-error",
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
