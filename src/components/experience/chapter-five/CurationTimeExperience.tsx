import Link from "next/link";

import {
  buildCurationTimeLines,
  resolveCurationTimePhase,
} from "./curation-time-model";
import { ExperienceLetterLine, ExperienceShell, JourneyHostHeader } from "../shared";

type CurationTimeExperienceProps = {
  daysSinceStart: number;
};

export function CurationTimeExperience({ daysSinceStart }: CurationTimeExperienceProps) {
  const phase = resolveCurationTimePhase(daysSinceStart);
  const lines = buildCurationTimeLines(phase);

  return (
    <ExperienceShell rootClassName="chapter-one curation-time">
      <section className="curation-time__presence" aria-label="Continuidade da curadoria">
        <JourneyHostHeader />

        {lines.map((line, index) => (
          <ExperienceLetterLine
            key={index}
            text={line.text}
            animationDelay={`${0.12 + index * 0.2}s`}
            className={`curation-time__line chapter-one__letter-line ${
              line.emphasis ? "curation-time__line--emphasis" : ""
            }`}
          />
        ))}
      </section>

      {phase === "report_announced" && (
        <Link
          href="/relatorio"
          className="chapter-one__cta conversation__next-chapter chapter-one__letter-line"
          style={{ animationDelay: `${0.12 + lines.length * 0.2}s` }}
        >
          Receber com calma
        </Link>
      )}

      <p
        className="curation-presence__rest chapter-one__letter-line"
        style={{ animationDelay: `${0.12 + lines.length * 0.2}s` }}
      >
        Pode fechar esta página. Seguimos com você.
      </p>
    </ExperienceShell>
  );
}
