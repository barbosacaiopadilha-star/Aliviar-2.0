import type { Doctor } from "@/alicia/types";
import {
  buildProfileTimeline,
  buildTrajectoryStats,
  buildTrustOverview,
  formatSourceCount,
  formatUnverifiedFields,
  formatUpdatedAt,
  getProfileIntro,
  getSourceTrustLabel,
} from "@/alicia/lib/profile-narrative";
import { DoctorTrajectorySection } from "@/components/alicia/DoctorTrajectorySection";
import { DoctorTrustOverview } from "@/components/alicia/DoctorTrustOverview";

export function DoctorProfileView({ doctor }: { doctor: Doctor }) {
  const timeline = buildProfileTimeline(doctor);
  const stats = buildTrajectoryStats(doctor);
  const trustOverview = buildTrustOverview(doctor);
  const unverifiedMessage = formatUnverifiedFields(doctor.transparency.unverifiedFields);

  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4 border-b border-line pb-8">
        <p className="text-sm font-medium text-coral">{doctor.specialty}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">
          {doctor.name}
        </h1>
        <p className="text-sm text-ink-soft">
          {doctor.location.city}, {doctor.location.state}
        </p>
        <blockquote className="border-l-2 border-coral-soft pl-4 font-serif text-lg leading-relaxed text-ink">
          {getProfileIntro(doctor)}
        </blockquote>
      </header>

      <DoctorTrustOverview overview={trustOverview} />

      <DoctorTrajectorySection timeline={timeline} stats={stats} />

      {doctor.scientificProductionPlaceholder && (
        <section className="rounded-xl border border-dashed border-line bg-paper px-5 py-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Publicações</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Ainda não levantamos publicações para este perfil.
          </p>
        </section>
      )}

      <section className="rounded-xl bg-sage-soft/30 px-5 py-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Fontes e atualização</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Reunimos dados públicos de registros profissionais, formação e instituições de saúde.
          Atualizado em{" "}
          <span className="text-ink">{formatUpdatedAt(doctor.transparency.lastUpdated)}</span>, com
          base em {formatSourceCount(doctor.transparency.sourceCount)}.
        </p>
        <ul className="mt-4 space-y-3">
          {doctor.transparency.sources.map((source) => (
            <li key={source.name} className="text-sm text-ink-soft">
              <p>
                <span className="font-medium text-ink">{source.name}</span>
                <span className="text-ink-soft"> · {source.type}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {getSourceTrustLabel(source)} · conferido em{" "}
                {formatUpdatedAt(doctor.transparency.lastUpdated)}
              </p>
            </li>
          ))}
        </ul>
        {unverifiedMessage && (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{unverifiedMessage}</p>
        )}
      </section>

      <p className="text-center text-xs leading-relaxed text-ink-soft">
        Informações públicas para consulta. A AliCIA não recomenda médicos.
      </p>
    </article>
  );
}
