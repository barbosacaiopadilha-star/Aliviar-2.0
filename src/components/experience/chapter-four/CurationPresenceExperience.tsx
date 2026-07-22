import Link from "next/link";

import { buildCurationPresenceLines, CURATION_HOST } from "./curation-model";

export function CurationPresenceExperience() {
  const lines = buildCurationPresenceLines();

  return (
    <div className="chapter-one curation-presence">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main">
        <section className="curation-presence__letter" aria-label="Presença da curadoria">
          <p className="curation-presence__host-name">{CURATION_HOST}</p>
          <p className="curation-presence__host-role">Gestor da jornada · Equipe Aliviar</p>

          {lines.map((line, index) => (
            <p
              key={index}
              className={`curation-presence__line chapter-one__letter-line ${
                line.emphasis ? "curation-presence__line--emphasis" : ""
              } ${line.text.startsWith("Com presença") ? "curation-presence__signoff" : ""}`}
              style={{ animationDelay: `${0.15 + index * 0.22}s` }}
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
          className="curation-presence__rest chapter-one__letter-line"
          style={{ animationDelay: `${0.15 + lines.length * 0.22}s` }}
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
