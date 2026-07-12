"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { reassignCuratorAction } from "@/modules/cases/actions";

type CuratorOption = { id: string; name: string };

type CaseCuratorAssignmentProps = {
  caseId: string;
  currentCuratorId: string | null;
  currentCuratorName: string | null;
  curators: CuratorOption[];
};

export function CaseCuratorAssignment({
  caseId,
  currentCuratorId,
  currentCuratorName,
  curators,
}: CaseCuratorAssignmentProps) {
  const [assigned, setAssigned] = useState({ id: currentCuratorId, name: currentCuratorName });
  const [selected, setSelected] = useState(currentCuratorId ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    setError(null);
    const newCuratorId = selected || null;
    startTransition(async () => {
      const result = await reassignCuratorAction({ caseId, newCuratorId, reason: reason || undefined });
      if (result.success) {
        setAssigned({
          id: newCuratorId,
          name: newCuratorId ? (curators.find((c) => c.id === newCuratorId)?.name ?? null) : null,
        });
        setReason("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Curador médico atual:{" "}
        <span className="font-medium text-ink">{assigned.name ?? "Sem atribuição"}</span>
      </p>

      <Select aria-label="Curador médico" value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Sem atribuição</option>
        {curators.map((curator) => (
          <option key={curator.id} value={curator.id}>
            {curator.name}
          </option>
        ))}
      </Select>

      <Input
        label="Justificativa (opcional)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        isLoading={isPending}
        onClick={handleAssign}
      >
        {assigned.id ? "Reatribuir" : "Atribuir"}
      </Button>

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
