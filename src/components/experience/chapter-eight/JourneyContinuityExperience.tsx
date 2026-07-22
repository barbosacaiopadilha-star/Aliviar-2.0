import Link from "next/link";

import { CURATION_HOST } from "../chapter-four/curation-model";
import { buildContinuityLines, buildContinuityRestNote } from "./continuity-model";

export function JourneyContinuityExperience() {
  const lines = buildContinuityLines();
  const restNote = buildContinuityRestNote();

  return (
    <div className="chapter-one journey-continuity">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main">
        <section className="journey-continuity__letter" aria-label="Continuidade da jornada">
          <p className="curation-presence__host-name">{CURATION_HOST}</p>
          <p className="curation-presence__host-role">Gestor da jornada · Equipe Aliviar</p>

          {lines.map((line, index) => (
            <p
              key={index}
              className={`journey-continuity__line chapter-one__letter-line ${
                line.emphasis ? "journey-continuity__line--emphasis" : ""
              } ${line.text.startsWith("Com presença") ? "curation-presence__signoff" : ""} ${
                line.text.startsWith("Obrigado") ? "journey-continuity__gratitude" : ""
              }`}
              style={{ animationDelay: `${0.14 + index * 0.2}s` }}
            >
              {line.text.split("\n").map((part, partIndex, parts) => (
                <span key={partIndex}>
                  {part}
                  {partIndex < parts.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          ))}
        </section>

        <p
          className="journey-continuity__rest chapter-one__letter-line"
          style={{ animationDelay: `${0.14 + lines.length * 0.2}s` }}
        >
          {restNote}
        </p>
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
