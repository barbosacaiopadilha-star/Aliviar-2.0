import type { Metadata } from "next";

import { ThresholdExperience } from "@/components/experience/limiar/ThresholdExperience";

export const metadata: Metadata = {
  title: "Aliviar",
  description: "A luz ficou acesa.",
};

export default function HomePage() {
  return <ThresholdExperience />;
}
