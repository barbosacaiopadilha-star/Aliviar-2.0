import { buildCurationPresenceLines } from "./curation-model";
import { ExperienceLetterLine, ExperienceShell, JourneyHostHeader } from "../shared";

export function CurationPresenceExperience() {
  const lines = buildCurationPresenceLines();

  return (
    <ExperienceShell rootClassName="chapter-one curation-presence">
      <section className="curation-presence__letter" aria-label="Presença da curadoria">
        <JourneyHostHeader />

        {lines.map((line, index) => (
          <ExperienceLetterLine
            key={index}
            text={line.text}
            animationDelay={`${0.15 + index * 0.22}s`}
            className={`curation-presence__line chapter-one__letter-line ${
              line.emphasis ? "curation-presence__line--emphasis" : ""
            }`}
          />
        ))}
      </section>

      <p
        className="curation-presence__rest chapter-one__letter-line"
        style={{ animationDelay: `${0.15 + lines.length * 0.22}s` }}
      >
        Pode fechar esta página. Seguimos com você.
      </p>
    </ExperienceShell>
  );
}
