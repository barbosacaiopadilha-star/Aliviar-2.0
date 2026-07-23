"use client";

import { useEffect, useState } from "react";

import { CuratorWorkspaceSurface } from "@/components/curador/workspace/CuratorWorkspaceSurface";
import type { CuratorWorkspaceView } from "@/curator-workspace";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; view: CuratorWorkspaceView }
  | { status: "error"; message: string };

interface CuratorWorkspaceLoaderProps {
  journeyId: string;
}

export function CuratorWorkspaceLoader({ journeyId }: CuratorWorkspaceLoaderProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    void fetch(`/api/v1/curador/workspace/${journeyId}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? "Não foi possível abrir o workspace.");
        }
        return response.json() as Promise<CuratorWorkspaceView>;
      })
      .then((view) => setState({ status: "ready", view }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, [journeyId]);

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
    <CuratorWorkspaceSurface
      journeyId={journeyId}
      initialView={state.view}
      onViewChange={(view) => setState({ status: "ready", view })}
    />
  );
}
