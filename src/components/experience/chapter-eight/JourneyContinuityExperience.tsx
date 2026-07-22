import { buildContinuityLines, buildContinuityRestNote } from "./continuity-model";
import { ExperienceLetterLine, ExperienceShell, JourneyHostHeader } from "../shared";

export function JourneyContinuityExperience() {
  const lines = buildContinuityLines();
  const restNote = buildContinuityRestNote();

  return (
    <ExperienceShell rootClassName="chapter-one journey-continuity">
      <section className="journey-continuity__letter" aria-label="Continuidade da jornada">
        <JourneyHostHeader />

        {lines.map((line, index) => (
          <ExperienceLetterLine
            key={index}
            text={line.text}
            animationDelay={`${0.14 + index * 0.2}s`}
            className={`journey-continuity__line chapter-one__letter-line ${
              line.emphasis ? "journey-continuity__line--emphasis" : ""
            } ${line.text.startsWith("Obrigado") ? "journey-continuity__gratitude" : ""}`}
          />
        ))}
      </section>

      <p
        className="journey-continuity__rest chapter-one__letter-line"
        style={{ animationDelay: `${0.14 + lines.length * 0.2}s` }}
      >
        {restNote}
      </p>
    </ExperienceShell>
  );
}
