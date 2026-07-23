import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isAliciaStudioEnabled } from "@/alicia/studio/studio-access";
import { AliciaStudioShell } from "@/components/alicia/studio/AliciaStudioShell";
import { StudioProvider } from "@/components/alicia/studio/StudioProvider";

export const metadata: Metadata = {
  title: "AliCIA Studio",
  robots: { index: false, follow: false },
};

export default function AliciaStudioLayout({ children }: { children: React.ReactNode }) {
  if (!isAliciaStudioEnabled()) {
    notFound();
  }

  return (
    <StudioProvider>
      <AliciaStudioShell>{children}</AliciaStudioShell>
    </StudioProvider>
  );
}
