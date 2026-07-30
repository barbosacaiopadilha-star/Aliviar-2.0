"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DecisionCaseViewer } from "@/components/ace/decision-case-viewer";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import { saveP002FieldCorrectionAction } from "@/modules/ace/p002-field-corrections-actions";
import {
  applyHumanCorrectionsToMissingInformation,
  type P002HumanFieldCorrection,
} from "@/modules/ace/protocols/p002-human-overrides";

type DecisionCasePanelProps = {
  caseId: string;
  decisionCase: DecisionCase;
  decisionCaseArtifactId: string;
  narrative: Narrative | null;
  initialCorrections: P002HumanFieldCorrection[];
  canCorrect?: boolean;
};

export function DecisionCasePanel({
  caseId,
  decisionCase,
  decisionCaseArtifactId,
  narrative,
  initialCorrections,
  canCorrect = true,
}: DecisionCasePanelProps) {
  const router = useRouter();
  const [corrections, setCorrections] = useState(initialCorrections);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayCase: DecisionCase =
    narrative && corrections.length > 0
      ? {
          ...decisionCase,
          missingInformation: applyHumanCorrectionsToMissingInformation(
            narrative,
            decisionCase.missingInformation,
            corrections,
          ),
        }
      : decisionCase;

  function handleCorrection(correction: P002HumanFieldCorrection) {
    startTransition(async () => {
      setError(null);
      const result = await saveP002FieldCorrectionAction({
        caseId,
        decisionCaseArtifactId,
        field: correction.field,
        estado: correction.estado,
        motivo: correction.motivo,
        valorAnterior: correction.valorAnterior,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setCorrections((current) => [
        ...current.filter((entry) => entry.field !== correction.field),
        correction,
      ]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <DecisionCaseViewer
        decisionCase={displayCase}
        narrative={narrative}
        humanCorrections={corrections}
        onCorrection={canCorrect && !isPending ? handleCorrection : undefined}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {isPending ? <p className="text-sm text-ink-muted">Registrando correção…</p> : null}
    </div>
  );
}
