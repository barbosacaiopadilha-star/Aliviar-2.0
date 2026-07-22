import type { Metadata } from "next";

import { ThresholdExperience } from "@/components/experience/limiar/ThresholdExperience";

export const metadata: Metadata = {
  title: "Aliviar",
  description: "A luz ficou acesa. Pessoas que escutam com calma.",
};

export default function HomePage() {
  const filmSrc = process.env.NEXT_PUBLIC_ALIVIAR_FILM_SRC;

  return <ThresholdExperience filmSrc={filmSrc} />;
}
