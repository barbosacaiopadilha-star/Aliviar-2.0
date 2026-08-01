import { Alert } from "@/components/ui/alert";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import type { FinalCuradoriaDeliveryRecord } from "@/modules/concierge/types";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";

type FinalCuradoriaViewProps = {
  delivery: FinalCuradoriaDeliveryRecord;
};

function OptionCard({ presentation }: { presentation: ProviderPresentation }) {
  // Sem ordinal: "Primeiro/Segundo/Terceiro caminho" lê como colocação, e
  // posição nunca significa preferência (A_MESA N2; Etapa Mesa §4). O nome
  // abre o cartão — os três com o mesmo peso.
  return (
    <PatientCard className="flex h-full flex-col">
      <h3 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        {presentation.displayName}
      </h3>
      <p className="patient-body mt-3 text-[var(--patient-ink)]">{presentation.professionalSummary}</p>
      <p className="patient-body mt-3 text-[var(--color-ink-muted)]">{presentation.whyIncluded}</p>

      {presentation.strengthsForThisCase.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-border)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-sage)]">
            O que oferece
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--patient-ink)]">
            {presentation.strengthsForThisCase.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--color-brand-sage)]">
                  ·
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {presentation.practicalConsiderations.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-border)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-sage)]">
            Bom saber antes de conversar
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-ink-muted)]">
            {presentation.practicalConsiderations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {presentation.relevantLimitations.length > 0 ? (
        <div className="mt-5 border-t border-[var(--color-border)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-sage)]">
            Vale considerar
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-ink-muted)]">
            {presentation.relevantLimitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </PatientCard>
  );
}

export function FinalCuradoriaView({ delivery }: FinalCuradoriaViewProps) {
  return (
    <div className="space-y-10">
      <PatientPageHeader
        eyebrow="Seu relatório"
        title="Um documento para reler com calma."
        description={`Entregue em ${new Date(delivery.deliveredAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })} pela Aliviar.`}
      />

      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">O que você nos trouxe</h2>
        <p className="patient-body mt-3 text-[var(--patient-ink)]">{delivery.decisionSummary}</p>
      </PatientCard>

      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
          Como construímos sua Curadoria
        </h2>
        <p className="patient-body mt-3 text-[var(--patient-ink)]">{delivery.methodExplanation}</p>
        <p className="patient-body mt-3 text-[var(--color-ink-muted)]">{delivery.clientContextSummary}</p>
      </PatientCard>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
            As três opções
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium text-[var(--patient-ink)] lg:text-3xl">
            {/* Correção de Método (reintegração): a palavra proibida não entra
                no vocabulário do paciente nem para ser negada — não se nomeia
                o que não deve existir (Ontologia §8; teste deste componente). */}
            Três caminhos legítimos — sem ordem de preferência
          </h2>
          <p className="patient-body mt-3 max-w-2xl text-[var(--color-ink-muted)]">
            {delivery.comparisonSummary}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {delivery.providerPresentations.map((presentation) => (
            <OptionCard key={presentation.providerId} presentation={presentation} />
          ))}
        </div>
      </section>

      <PatientCard>
        <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Próximos passos</h2>
        <ul className="mt-4 space-y-2 text-[var(--patient-ink)]">
          {delivery.nextSteps.map((step) => (
            <li key={step} className="patient-body flex gap-2">
              <span aria-hidden="true" className="text-[var(--color-brand-sage)]">
                ·
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </PatientCard>

      <Alert variant="info">{delivery.disclaimer}</Alert>
    </div>
  );
}
