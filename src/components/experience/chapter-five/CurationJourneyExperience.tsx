"use client";

import { useState } from "react";

import { CurationPresenceExperience } from "../chapter-four/CurationPresenceExperience";
import { CurationTimeExperience } from "./CurationTimeExperience";
import { readCurationJourneyView, type CurationJourneyView } from "./curation-journey-storage";
import { ExperienceShell } from "../shared";

export function CurationJourneyExperience() {
  const [view] = useState<CurationJourneyView | null>(() =>
    typeof window !== "undefined" ? readCurationJourneyView(localStorage) : null,
  );

  if (!view) {
    return (
      <ExperienceShell rootClassName="chapter-one curation-journey" mainAriaHidden>
        {null}
      </ExperienceShell>
    );
  }

  if (view.mode === "opening") {
    return <CurationPresenceExperience />;
  }

  return <CurationTimeExperience daysSinceStart={view.daysSinceStart} />;
}
