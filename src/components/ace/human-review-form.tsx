"use client";

import { useMemo, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { ProviderChange, ReviewAction } from "@/modules/ace/artifacts/human-review-result";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";
import { submitHumanReviewAction } from "@/modules/concierge/human-review-actions";

const RETURN_TO_PROTOCOL_OPTIONS: ProtocolId[] = ["P001", "P002", "P003", "P004", "P005", "P006", "P007", "P008"];

const REVIEW_ACTION_LABELS: Record<ReviewAction, string> = {
  APPROVE: "Aprovar integralmente",
  ADJUST: "Ajustar composição",
  REJECT: "Rejeitar",
  REQUEST_MORE_INFORMATION: "Solicitar mais informações",
};

type HumanReviewFormProps = {
  caseId: string;
  shortlist: Shortlist;
  compatibilityMatrix: CompatibilityMatrix;
  // Resolvido no servidor (isEssentiallyQualified importaria node:crypto —
  // via createCompatibilityMatrix, no mesmo arquivo — para dentro do bundle
  // do cliente). O critério em si nunca é duplicado aqui, só o resultado.
  qualifiedProviderIds: string[];
  namesByProviderId: Record<string, string>;
};

function EvidenceListEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          label={label}
          hideLabel
          placeholder={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" size="md" className="w-auto shrink-0" onClick={add}>
          Adicionar
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center gap-2 rounded-sm border border-border bg-canvas px-2.5 py-1 text-xs text-ink">
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={`Remover evidência "${item}"`}
                className="text-ink-muted hover:text-error"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// Formulário do P009 — nunca decide nada por conta própria: só coleta a
// decisão que um humano autorizado já tomou (reviewAction, justificativa,
// evidências e, no caso de ADJUST, as alterações concretas) e a envia para
// validação estrutural pelo protocolo. Todo campo aqui é preenchido por
// quem está revisando, nunca inferido ou sugerido pelo sistema.
export function HumanReviewForm({
  caseId,
  shortlist,
  compatibilityMatrix,
  qualifiedProviderIds,
  namesByProviderId,
}: HumanReviewFormProps) {
  const baseline = useMemo(
    () => (shortlist.status === "COMPOSED" ? shortlist.selectedProviderIds : []),
    [shortlist],
  );

  const [reviewAction, setReviewAction] = useState<ReviewAction>(shortlist.status === "COMPOSED" ? "APPROVE" : "ADJUST");
  const [reviewRationale, setReviewRationale] = useState("");
  const [evidenceReferences, setEvidenceReferences] = useState<string[]>([]);
  const [returnToProtocol, setReturnToProtocol] = useState<ProtocolId | "">("");
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(new Set(baseline));
  const [changeDetails, setChangeDetails] = useState<Record<string, { rationale: string; evidenceReferences: string[] }>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleProvider(providerId: string) {
    setSelectedProviderIds((current) => {
      const next = new Set(current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  }

  function updateChangeDetail(providerId: string, patch: Partial<{ rationale: string; evidenceReferences: string[] }>) {
    setChangeDetails((current) => {
      const previous = current[providerId] ?? { rationale: "", evidenceReferences: [] };
      return { ...current, [providerId]: { ...previous, ...patch } };
    });
  }

  function computeChanges(): ProviderChange[] {
    const changes: ProviderChange[] = [];
    for (const entry of compatibilityMatrix.entries) {
      const wasIncluded = baseline.includes(entry.providerId);
      const isIncluded = selectedProviderIds.has(entry.providerId);
      if (wasIncluded === isIncluded) continue;

      const detail = changeDetails[entry.providerId] ?? { rationale: "", evidenceReferences: [] };
      changes.push({
        type: isIncluded ? "added" : "removed",
        providerId: entry.providerId,
        rationale: detail.rationale,
        evidenceReferences: detail.evidenceReferences,
      });
    }
    return changes;
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const base = { caseId, reviewRationale };

      const result = await submitHumanReviewAction(
        reviewAction === "APPROVE"
          ? { ...base, reviewAction: "APPROVE", evidenceReferences }
          : reviewAction === "ADJUST"
            ? { ...base, reviewAction: "ADJUST", evidenceReferences, changes: computeChanges() }
            : {
                ...base,
                reviewAction,
                evidenceReferences,
                returnToProtocol: returnToProtocol || null,
              },
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.reload();
    });
  }

  const changedProviderIds = compatibilityMatrix.entries
    .map((entry) => entry.providerId)
    .filter((providerId) => baseline.includes(providerId) !== selectedProviderIds.has(providerId));

  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Ação da revisão</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(REVIEW_ACTION_LABELS) as ReviewAction[]).map((action) => (
            <Radio
              key={action}
              id={`reviewAction-${action}`}
              name="reviewAction"
              label={REVIEW_ACTION_LABELS[action]}
              checked={reviewAction === action}
              onChange={() => setReviewAction(action)}
            />
          ))}
        </div>
      </fieldset>

      {reviewAction === "APPROVE" ? (
        <Alert variant="info">
          Aprovar aceita integralmente a Shortlist como está — {shortlist.status === "COMPOSED" ? shortlist.selectedProviderIds.length : 0} profissional(is) proposto(s), sem alteração.
        </Alert>
      ) : null}

      {reviewAction === "ADJUST" ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            Marque quem deve compor a curadoria final. Selecionados: {selectedProviderIds.size} de 3.
          </p>
          <ul className="space-y-3">
            {compatibilityMatrix.entries.map((entry) => {
              const qualified = qualifiedProviderIds.includes(entry.providerId);
              const wasIncluded = baseline.includes(entry.providerId);
              const isIncluded = selectedProviderIds.has(entry.providerId);
              const changed = wasIncluded !== isIncluded;

              return (
                <li key={entry.providerId} className="rounded-md border border-border p-3">
                  <Checkbox
                    label={`${namesByProviderId[entry.providerId] ?? entry.providerId}${wasIncluded ? " (na Shortlist original)" : ""}${qualified ? "" : " — análise insuficiente"}`}
                    checked={isIncluded}
                    disabled={!qualified && !wasIncluded}
                    onChange={() => toggleProvider(entry.providerId)}
                  />
                  {changed ? (
                    <div className="mt-2 space-y-2 border-t border-border pt-2">
                      <Textarea
                        aria-label={`Justificativa para ${isIncluded ? "adicionar" : "remover"} ${namesByProviderId[entry.providerId] ?? entry.providerId}`}
                        placeholder="Justificativa desta alteração..."
                        rows={2}
                        value={changeDetails[entry.providerId]?.rationale ?? ""}
                        onChange={(event) => updateChangeDetail(entry.providerId, { rationale: event.target.value })}
                      />
                      <EvidenceListEditor
                        label={`Evidências para esta alteração`}
                        value={changeDetails[entry.providerId]?.evidenceReferences ?? []}
                        onChange={(next) => updateChangeDetail(entry.providerId, { evidenceReferences: next })}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {(reviewAction === "REJECT" || reviewAction === "REQUEST_MORE_INFORMATION") ? (
        <FormField label="Retornar a qual etapa? (opcional)" htmlFor="returnToProtocol">
          <Select
            id="returnToProtocol"
            value={returnToProtocol}
            onChange={(event) => setReturnToProtocol(event.target.value as ProtocolId | "")}
          >
            <option value="">Nenhuma — só registrar a decisão</option>
            {RETURN_TO_PROTOCOL_OPTIONS.map((protocolId) => (
              <option key={protocolId} value={protocolId}>
                {protocolId}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}

      <FormField label="Justificativa da decisão" htmlFor="reviewRationale" hint="Obrigatória para toda ação.">
        <Textarea
          id="reviewRationale"
          rows={4}
          value={reviewRationale}
          onChange={(event) => setReviewRationale(event.target.value)}
          placeholder="Descreva por que esta decisão foi tomada..."
        />
      </FormField>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Evidências gerais da decisão</p>
        <EvidenceListEditor label="Nova evidência" value={evidenceReferences} onChange={setEvidenceReferences} />
      </div>

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}

      <Button
        type="button"
        isLoading={isPending}
        disabled={
          reviewRationale.trim().length < 10 ||
          ((reviewAction === "APPROVE" || reviewAction === "ADJUST") && evidenceReferences.length === 0) ||
          (reviewAction === "ADJUST" &&
            (selectedProviderIds.size !== 3 ||
              changedProviderIds.length === 0 ||
              changedProviderIds.some((id) => !changeDetails[id]?.rationale.trim() || !changeDetails[id]?.evidenceReferences.length)))
        }
        onClick={handleSubmit}
      >
        Registrar decisão
      </Button>
    </div>
  );
}
