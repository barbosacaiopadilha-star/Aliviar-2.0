import type { Metadata } from "next";

import { ThresholdExperience } from "@/components/experience/limiar/ThresholdExperience";

export const metadata: Metadata = {
  title: "Aliviar",
  description: "Aqui dentro, o mundo desacelera.",
};

export default function HomePage() {
  return <ThresholdExperience />;
}
