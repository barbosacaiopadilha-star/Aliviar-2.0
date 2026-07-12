import { Badge } from "@/components/ui/badge";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";

type AceShortlistViewerProps = {
  shortlist: Shortlist;
  namesByProviderId: Record<string, string>;
};

const BLOCKED_REASON_LABELS: Record<string, string> = {
  INSUFFICIENT_OPTIONS: "Opções insuficientes",
  INSUFFICIENT_EVIDENCE: "Evidências insuficientes",
  AMBIGUOUS_COMPOSITION: "Composição ambígua",
};

// Nunca ordena por relevância/pontuação — a ordem de listagem é sempre
// neutra (por providerId), refletindo a mesma regra do próprio ACE
// (docs/ace: "a ordem nunca representa ranking").
export function AceShortlistViewer({ shortlist, namesByProviderId }: AceShortlistViewerProps) {
  const providerIds = shortlist.status === "COMPOSED" ? shortlist.selectedProviderIds : shortlist.candidateProviderIds;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={shortlist.status === "COMPOSED" ? "sage" : "default"}>
          {shortlist.status === "COMPOSED" ? "Composta" : "Bloqueada"}
        </Badge>
        {shortlist.status === "BLOCKED" && shortlist.blockedReason ? (
          <Badge>{BLOCKED_REASON_LABELS[shortlist.blockedReason] ?? shortlist.blockedReason}</Badge>
        ) : null}
      </div>

      <p className="text-sm text-ink">{shortlist.compositionRationale}</p>

      {providerIds.length > 0 ? (
        <ul className="space-y-3">
          {providerIds.map((providerId) => {
            const rationale = shortlist.providerRationales.find((r) => r.providerId === providerId);
            return (
              <li key={providerId} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-ink">{namesByProviderId[providerId] ?? providerId}</p>
                <p className="mt-1 text-sm text-ink-muted">{rationale?.rationale ?? "Sem justificativa registrada."}</p>
              </li>
            );
          })}
        </ul>
      ) : null}

      {shortlist.relevantLimitations.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Limitações relevantes</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {shortlist.relevantLimitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {shortlist.missingInformation.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Informações ausentes</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {shortlist.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
