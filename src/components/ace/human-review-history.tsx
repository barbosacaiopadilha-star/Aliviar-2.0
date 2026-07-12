import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { HumanReviewResultRecord } from "@/modules/concierge/types";

const REVIEW_ACTION_LABELS: Record<HumanReviewResultRecord["reviewAction"], string> = {
  APPROVE: "Aprovou integralmente",
  ADJUST: "Ajustou a composição",
  REJECT: "Rejeitou",
  REQUEST_MORE_INFORMATION: "Solicitou mais informações",
};

const REVIEW_STATUS_LABELS: Record<HumanReviewResultRecord["reviewStatus"], string> = {
  VALIDATED: "Validada",
  REJECTED: "Rejeitada",
  INFORMATION_REQUESTED: "Informação solicitada",
};

type HumanReviewHistoryProps = {
  results: HumanReviewResultRecord[];
  namesByProviderId: Record<string, string>;
};

// Histórico completo e imutável de decisões humanas sobre este Caso — a
// primeira etapa do produto com autoridade decisória real, por isso nunca
// oculta uma decisão anterior (mesmo uma rejeição substituída depois por
// uma aprovação). Cada linha aqui é rastreável, auditável e explicável por
// si só (Princípios da Sprint P009).
export function HumanReviewHistory({ results, namesByProviderId }: HumanReviewHistoryProps) {
  if (results.length === 0) {
    return <EmptyState title="Nenhuma decisão de revisão humana registrada ainda para este caso." />;
  }

  return (
    <ul className="space-y-4">
      {results.map((result) => (
        <li key={result.id} className="rounded-md border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={result.reviewStatus === "VALIDATED" ? "sage" : "default"}>
              {REVIEW_STATUS_LABELS[result.reviewStatus]}
            </Badge>
            <span className="text-sm font-medium text-ink">{REVIEW_ACTION_LABELS[result.reviewAction]}</span>
            <span className="text-xs text-ink-muted">
              {result.reviewerName} — {new Date(result.reviewedAt).toLocaleString("pt-BR")}
            </span>
          </div>

          <p className="mt-2 text-sm text-ink">{result.reviewRationale}</p>

          {result.evidenceReferences.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Evidências</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                {result.evidenceReferences.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.approvedProviderIds.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Composição aprovada</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
                {result.approvedProviderIds.map((providerId) => (
                  <li key={providerId}>{namesByProviderId[providerId] ?? providerId}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.changes.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Alterações</p>
              <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                {result.changes.map((change, index) => (
                  <li key={`${change.providerId}-${index}`}>
                    <span className="font-medium text-ink">
                      {change.type === "added" ? "Incluiu" : "Removeu"} {namesByProviderId[change.providerId] ?? change.providerId}
                    </span>
                    {" — "}
                    {change.rationale}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.returnToProtocol ? (
            <p className="mt-2 text-xs text-ink-muted">Retorno solicitado ao estágio: {result.returnToProtocol}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
