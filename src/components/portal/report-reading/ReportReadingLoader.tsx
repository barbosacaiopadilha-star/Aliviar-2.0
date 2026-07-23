"use client";

import { useEffect, useState } from "react";

import { ReportReadingSurface } from "@/components/portal/report-reading/ReportReadingSurface";
import type { ReportReadingView } from "@/product-experience/report-reading";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; view: ReportReadingView }
  | { status: "error"; message: string };

export function ReportReadingLoader() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    void fetch("/api/v1/me/relatorio-leitura")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "Não foi possível carregar o relatório.");
        }
        return response.json() as Promise<ReportReadingView>;
      })
      .then((view) => setState({ status: "ready", view }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <p className="text-ink/60">Preparando seu relatório...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <p className="text-ink/70">{state.message}</p>
      </main>
    );
  }

  return (
    <ReportReadingSurface
      initialView={state.view}
      onViewChange={(view) => setState({ status: "ready", view })}
    />
  );
}
