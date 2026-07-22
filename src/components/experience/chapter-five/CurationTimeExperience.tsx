import Link from "next/link";

import {
  buildCurationTimeLines,
  resolveCurationTimePhase,
} from "./curation-time-model";
import { CURATION_HOST } from "../chapter-four/curation-model";

type CurationTimeExperienceProps = {
  daysSinceStart: number;
};

export function CurationTimeExperience({ daysSinceStart }: CurationTimeExperienceProps) {
  const phase = resolveCurationTimePhase(daysSinceStart);
  const lines = buildCurationTimeLines(phase);

  return (
    <div className="chapter-one curation-time">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main">
        <section className="curation-time__presence" aria-label="Continuidade da curadoria">
          <p className="curation-presence__host-name">{CURATION_HOST}</p>
          <p className="curation-presence__host-role">Gestor da jornada · Equipe Aliviar</p>

          {lines.map((line, index) => (
            <p
              key={index}
              className={`curation-time__line chapter-one__letter-line ${
                line.emphasis ? "curation-time__line--emphasis" : ""
              } ${line.text.startsWith("Com presença") ? "curation-presence__signoff" : ""}`}
              style={{ animationDelay: `${0.12 + index * 0.2}s` }}
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
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
