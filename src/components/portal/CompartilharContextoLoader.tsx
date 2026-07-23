"use client";

import { useEffect, useState } from "react";

import { CompartilharContextoSurface } from "@/components/portal/CompartilharContextoSurface";
import type { CompartilharContextoView } from "@/vertical-slice";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; view: CompartilharContextoView }
  | { status: "error"; message: string };

export function CompartilharContextoLoader() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    void fetch("/api/v1/me/compartilhar-contexto")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "Não foi possível carregar.");
        }
        return response.json() as Promise<CompartilharContextoView>;
      })
      .then((view) => setState({ status: "ready", view }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <p className="text-ink/60">Um momento...</p>
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
    <CompartilharContextoSurface
      initialView={state.view}
      onShared={(view) => setState({ status: "ready", view })}
    />
  );
}
