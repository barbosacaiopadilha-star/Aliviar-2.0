import Link from "next/link";

import {
  buildReportReadyClosingNote,
  buildReportReadyLines,
} from "./report-ready-model";
import { ExperienceLetterLine, ExperienceShell, JourneyHostHeader } from "../shared";

export function ReportReadyExperience() {
  const lines = buildReportReadyLines();
  const closingNote = buildReportReadyClosingNote();

  return (
    <ExperienceShell rootClassName="chapter-one report-ready">
      <section className="report-ready__letter" aria-label="Relatório de curadoria pronto">
        <JourneyHostHeader />

        {lines.map((line, index) => (
          <ExperienceLetterLine
            key={index}
            text={line.text}
            animationDelay={`${0.14 + index * 0.21}s`}
            className={`report-ready__line chapter-one__letter-line ${
              line.emphasis ? "report-ready__line--emphasis" : ""
            }`}
          />
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
    </ExperienceShell>
  );
}
