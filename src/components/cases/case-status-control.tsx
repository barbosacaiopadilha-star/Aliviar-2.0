"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { changeCaseStatusAction } from "@/modules/cases/actions";
import { allowedNextStatuses } from "@/modules/cases/state-machine";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

type CaseStatusControlProps = {
  caseId: string;
  currentStatus: CaseStatus;
};

export function CaseStatusControl({ caseId, currentStatus }: CaseStatusControlProps) {
  const [status, setStatus] = useState(currentStatus);
  const [nextStatus, setNextStatus] = useState<CaseStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const options = allowedNextStatuses(status);

  function handleChange() {
    if (!nextStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await changeCaseStatusAction({ caseId, nextStatus });
      if (result.success) {
        setStatus(nextStatus);
        setNextStatus("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">
        Status atual: <span className="font-medium text-ink">{CASE_STATUS_LABELS[status]}</span>
      </p>

      {options.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            aria-label="Novo status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as CaseStatus)}
          >
            <option value="">Selecione o novo status</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {CASE_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            isLoading={isPending}
            disabled={!nextStatus}
            onClick={handleChange}
          >
            Mudar status
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Este é um status final — não há mais transições.</p>
      )}

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
