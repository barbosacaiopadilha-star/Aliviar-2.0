import type {
  PresentedInstitution,
  ProfileTimelineEntry,
  TrajectoryStat,
} from "@/alicia/lib/profile-narrative";
import { MEDICAL_TERM_DEFINITIONS } from "@/alicia/lib/profile-narrative";

function InstitutionCard({ institution }: { institution: PresentedInstitution }) {
  const location = [institution.city, institution.state].filter(Boolean).join(", ");

  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-3">
      <p className="text-sm font-medium text-ink">{institution.name}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {institution.type}
        {location ? ` · ${location}` : ""}
      </p>
      {institution.description && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{institution.description}</p>
      )}
    </div>
  );
}

function ConfirmationBadge({ label }: { label: string }) {
  const isConfirmed = label === "Confirmado";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        isConfirmed ? "bg-sage-soft/60 text-ink" : "bg-paper text-ink-soft"
      }`}
    >
      {isConfirmed ? <span aria-hidden>✓</span> : null}
      {label}
    </span>
  );
}

function TimelineEntryCard({ entry }: { entry: ProfileTimelineEntry }) {
  return (
    <li className="alicia-timeline__item">
      <div className="alicia-timeline__marker" aria-hidden />
      <div className="alicia-timeline__content space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-coral">
              {entry.yearLabel}
            </p>
            <h3 className="mt-1 font-serif text-lg font-semibold text-ink">{entry.event}</h3>
          </div>
          <ConfirmationBadge label={entry.confirmationLabel} />
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{entry.explanation}</p>

        {entry.institution && <InstitutionCard institution={entry.institution} />}

        {entry.todayDetails && (
          <div className="space-y-4 rounded-xl bg-paper px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Onde atende
              </p>
              <p className="mt-1 text-sm text-ink">{entry.todayDetails.locationLabel}</p>
            </div>

            {entry.todayDetails.practiceAreas.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Principais áreas
                </p>
                <ul className="mt-2 space-y-2">
                  {entry.todayDetails.practiceAreas.map((area) => (
                    <li key={area.name}>
                      <p className="text-sm font-medium text-ink">{area.name}</p>
                      <p className="text-sm leading-relaxed text-ink-soft">{area.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.todayDetails.institutions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Instituições atuais
                </p>
                {entry.todayDetails.institutions.map((institution) => (
                  <InstitutionCard key={institution.name} institution={institution} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function TrajectoryStats({ stats }: { stats: TrajectoryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-line bg-paper px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-ink">{stat.value}</p>
          <p className="mt-1 text-xs text-ink-soft">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function MedicalTermsGlossary() {
  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-5">
      <h3 className="font-serif text-base font-semibold text-ink">Termos que você pode ver aqui</h3>
      <dl className="mt-4 space-y-3">
        {MEDICAL_TERM_DEFINITIONS.map((item) => (
          <div key={item.term}>
            <dt className="text-sm font-medium text-ink">{item.term}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{item.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DoctorTrajectorySection({
  timeline,
  stats,
}: {
  timeline: ProfileTimelineEntry[];
  stats: TrajectoryStat[];
}) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-semibold text-ink">A trajetória</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          Uma linha do tempo para entender como esta pessoa se formou e onde atua hoje.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Resumo da trajetória
        </h3>
        <TrajectoryStats stats={stats} />
      </div>

      <ol className="alicia-timeline">
        {timeline.map((entry) => (
          <TimelineEntryCard key={entry.key} entry={entry} />
        ))}
      </ol>

      <MedicalTermsGlossary />
    </section>
  );
}
