"use client";

import { useEffect, useState } from "react";

import { PrimeiroPortalSurface } from "@/components/portal/PrimeiroPortalSurface";
import type { PrimeiroPortalView } from "@/vertical-slice";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; view: PrimeiroPortalView }
  | { status: "error"; message: string };

export function PrimeiroPortalLoader() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    void fetch("/api/v1/me/primeiro-portal")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "Não foi possível carregar o portal.");
        }
        return response.json() as Promise<PrimeiroPortalView>;
      })
      .then((view) => setState({ status: "ready", view }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6" data-testid="primeiro-portal-loading">
        <p className="text-ink/60">Um momento...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6" data-testid="primeiro-portal-error">
        <p className="text-ink/70">{state.message}</p>
      </main>
    );
  }

  return <PrimeiroPortalSurface view={state.view} />;
}
