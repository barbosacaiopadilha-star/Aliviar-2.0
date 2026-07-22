import type { Metadata } from "next";

import { ThresholdExperience } from "@/components/experience/limiar/ThresholdExperience";
import { landingJsonLd, landingPageMetadata } from "@/lib/landing/seo";

export const metadata: Metadata = landingPageMetadata;

export default function HomePage() {
  const filmSrc = process.env.NEXT_PUBLIC_ALIVIAR_FILM_SRC;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />
      <ThresholdExperience filmSrc={filmSrc} />
    </>
  );
}
