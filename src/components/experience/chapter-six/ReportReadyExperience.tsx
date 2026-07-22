import Link from "next/link";

import { CURATION_HOST } from "../chapter-four/curation-model";
import {
  buildReportReadyClosingNote,
  buildReportReadyLines,
} from "./report-ready-model";

export function ReportReadyExperience() {
  const lines = buildReportReadyLines();
  const closingNote = buildReportReadyClosingNote();

  return (
    <div className="chapter-one report-ready">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main">
        <section className="report-ready__letter" aria-label="Relatório de curadoria pronto">
          <p className="curation-presence__host-name">{CURATION_HOST}</p>
          <p className="curation-presence__host-role">Gestor da jornada · Equipe Aliviar</p>

          {lines.map((line, index) => (
            <p
              key={index}
              className={`report-ready__line chapter-one__letter-line ${
                line.emphasis ? "report-ready__line--emphasis" : ""
              } ${line.text.startsWith("Com presença") ? "curation-presence__signoff" : ""}`}
              style={{ animationDelay: `${0.14 + index * 0.21}s` }}
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
          className="report-ready__closing chapter-one__letter-line"
          style={{ animationDelay: `${0.14 + lines.length * 0.21}s` }}
        >
          {closingNote}
        </p>

        <p
          className="report-ready__cta-wrap chapter-one__letter-line"
          style={{ animationDelay: `${0.14 + (lines.length + 1) * 0.21}s` }}
        >
          <Link href="/relatorio/leitura" className="chapter-one__cta">
            Ler meu relatório
          </Link>
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
