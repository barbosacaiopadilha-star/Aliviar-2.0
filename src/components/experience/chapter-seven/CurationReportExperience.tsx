import Link from "next/link";

import { CURATION_HOST } from "../chapter-four/curation-model";
import {
  getExemplarCurationReport,
  professionalSectionLabel,
} from "./curation-report-model";

export function CurationReportExperience() {
  const report = getExemplarCurationReport();

  return (
    <div className="chapter-one curation-report">
      <div className="chapter-one__atmosphere" aria-hidden="true">
        <div className="chapter-one__glow chapter-one__glow--warm" />
      </div>

      <main className="chapter-one__main curation-report__main">
        <article className="curation-report__document" aria-label={report.title}>
          <header className="curation-report__header">
            <p className="curation-report__eyebrow">Aliviar · Curadoria Médica</p>
            <h1 className="curation-report__title">{report.title}</h1>
            <p className="curation-report__meta">
              Preparado por {report.preparedBy} · Equipe Aliviar
            </p>
          </header>

          <section className="curation-report__section" aria-labelledby="report-context">
            <h2 id="report-context" className="curation-report__section-title">
              Seu contexto
            </h2>
            {report.patientContext.map((paragraph, index) => (
              <p key={index} className="curation-report__paragraph">
                {paragraph}
              </p>
            ))}
          </section>

          <section className="curation-report__section" aria-labelledby="report-criteria">
            <h2 id="report-criteria" className="curation-report__section-title">
              Critérios da análise
            </h2>
            <p className="curation-report__paragraph">{report.criteriaIntro}</p>
            <dl className="curation-report__criteria">
              {report.criteria.map((criterion) => (
                <div key={criterion.title} className="curation-report__criterion">
                  <dt className="curation-report__criterion-term">{criterion.title}</dt>
                  <dd className="curation-report__criterion-desc">{criterion.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="curation-report__section" aria-labelledby="report-professionals">
            <h2 id="report-professionals" className="curation-report__section-title">
              Profissionais recomendados
            </h2>
            <p className="curation-report__paragraph">{report.professionalsIntro}</p>

            {report.professionals.map((professional, index) => (
              <section
                key={professional.id}
                className="curation-report__professional"
                aria-labelledby={`professional-${professional.id}-title`}
              >
                <p className="curation-report__professional-label">
                  {professionalSectionLabel(index)}
                </p>
                <h3 id={`professional-${professional.id}-title`} className="curation-report__professional-name">
                  {professional.name}
                </h3>
                <p className="curation-report__professional-meta">
                  {professional.specialty}
                  <span aria-hidden="true"> · </span>
                  <span className="curation-report__registry">{professional.registry}</span>
                </p>

                <div className="curation-report__professional-body">
                  <div className="curation-report__facet">
                    <h4 className="curation-report__facet-title">Por que aparece neste relatório</h4>
                    <p className="curation-report__paragraph">{professional.whyInReport}</p>
                  </div>
                  <div className="curation-report__facet">
                    <h4 className="curation-report__facet-title">Formação e trajetória</h4>
                    <p className="curation-report__paragraph">{professional.formationAndTrajectory}</p>
                  </div>
                  <div className="curation-report__facet">
                    <h4 className="curation-report__facet-title">Quando pode ser uma boa escolha</h4>
                    <p className="curation-report__paragraph">{professional.whenGoodChoice}</p>
                  </div>
                </div>
              </section>
            ))}
          </section>

          <footer className="curation-report__closing">
            <h2 className="curation-report__section-title">Sua decisão</h2>
            {report.closingParagraphs.map((paragraph, index) => (
              <p key={index} className="curation-report__paragraph">
                {paragraph}
              </p>
            ))}
            <p className="curation-report__signoff">
              Com presença,
              <span className="curation-report__signoff-name">{CURATION_HOST}</span>
            </p>
          </footer>
        </article>
      </main>

      <footer className="chapter-one__footer">
        <Link href="/login" className="chapter-one__staff-link">
          Equipe Aliviar
        </Link>
      </footer>
    </div>
  );
}
