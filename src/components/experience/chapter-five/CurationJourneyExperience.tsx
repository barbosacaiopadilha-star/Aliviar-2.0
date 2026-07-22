"use client";

import { useState } from "react";

import { CurationPresenceExperience } from "../chapter-four/CurationPresenceExperience";
import { CurationTimeExperience } from "./CurationTimeExperience";
import { readCurationJourneyView, type CurationJourneyView } from "./curation-journey-storage";

export function CurationJourneyExperience() {
  const [view] = useState<CurationJourneyView | null>(() =>
    typeof window !== "undefined" ? readCurationJourneyView(localStorage) : null,
  );

  if (!view) {
    return (
      <div className="chapter-one curation-journey">
        <div className="chapter-one__atmosphere" aria-hidden="true">
          <div className="chapter-one__glow chapter-one__glow--warm" />
        </div>
        <main className="chapter-one__main" aria-hidden="true" />
      </div>
    );
  }

  if (view.mode === "opening") {
    return <CurationPresenceExperience />;
  }

  return <CurationTimeExperience daysSinceStart={view.daysSinceStart} />;
}
