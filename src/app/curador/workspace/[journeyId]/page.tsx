import type { Metadata } from "next";

import { CuratorWorkspaceLoader } from "@/components/curador/workspace/CuratorWorkspaceLoader";

export const metadata: Metadata = {
  title: "Workspace do Curador — Aliviar",
  description: "Ambiente operacional para trabalhar sobre o relatório de curadoria.",
};

interface CuratorWorkspacePageProps {
  params: Promise<{ journeyId: string }>;
}

export default async function CuratorWorkspacePage({ params }: CuratorWorkspacePageProps) {
  const { journeyId } = await params;
  return <CuratorWorkspaceLoader journeyId={journeyId} />;
}
