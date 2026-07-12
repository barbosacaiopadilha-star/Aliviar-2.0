"use client";

import type { ReactNode } from "react";

import { ToastViewport } from "@/components/ui/toast";

/**
 * Ponto único de providers globais do lado do cliente. Hoje monta apenas o
 * ToastViewport (o mecanismo já existia em ui/toast.tsx, mas nunca era
 * renderizado em lugar nenhum — showToast() era efetivamente um no-op).
 * Futuros providers (tema, query client) entram aqui, nunca direto em
 * app/layout.tsx.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
