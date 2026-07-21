import { Alert } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import type { FinalCuradoriaDeliveryRecord } from "@/modules/concierge/types";

type FinalCuradoriaViewProps = {
  delivery: FinalCuradoriaDeliveryRecord;
};

// A experiência de entrega da Curadoria — a única tela desta sessão que
// mostra artefatos do ACE ao paciente, porque este é o único artefato
// desenhado para ele. Nunca mostra score, nota, ranking, percentual,
// protocolo, artefato interno ou nome de modelo de IA — só o que a equipe
// Aliviar já validou e traduziu para linguagem simples.
export function FinalCuradoriaView({ delivery }: FinalCuradoriaViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-ink">
          Sua Curadoria
        </h1>
        <p className="text-sm text-ink-muted">
          Entregue em{" "}
          {new Date(delivery.deliveredAt).toLocaleDateString("pt-BR")} pela
          equipe Aliviar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            O que você nos trouxe
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">{delivery.decisionSummary}</p>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Como construímos sua Curadoria
          </h2>
        </CardHeader>
        <p className="text-sm text-ink">{delivery.methodExplanation}</p>
        <p className="mt-2 text-sm text-ink-muted">
          {delivery.clientContextSummary}
        </p>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Profissionais recomendados para você
          </h2>
          <p className="text-sm text-ink-muted">{delivery.comparisonSummary}</p>
        </CardHeader>
        <div className="space-y-4">
          {delivery.providerPresentations.map((presentation) => (
            <div
              key={presentation.providerId}
              className="rounded-md border border-border p-4"
            >
              <h3 className="font-sans text-base font-semibold text-ink">
                {presentation.displayName}
              </h3>
              <p className="mt-1 text-sm text-ink">
                {presentation.professionalSummary}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {presentation.whyIncluded}
              </p>

              {presentation.strengthsForThisCase.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    O que esta pessoa pode oferecer
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
                    {presentation.strengthsForThisCase.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {presentation.practicalConsiderations.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Bom saber antes de conversar
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                    {presentation.practicalConsiderations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {presentation.relevantLimitations.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Vale considerar
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                    {presentation.relevantLimitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Próximos passos
          </h2>
        </CardHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
          {delivery.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </Card>

      <Alert variant="info">{delivery.disclaimer}</Alert>
    </div>
  );
}
