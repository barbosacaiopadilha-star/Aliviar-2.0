"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { createCaseAction } from "@/modules/cases/actions";

type StartCaseButtonProps = {
  storyId: string;
  curators: { id: string; name: string }[];
};

export function StartCaseButton({ storyId, curators }: StartCaseButtonProps) {
  const router = useRouter();
  const [selectedCuratorId, setSelectedCuratorId] = useState(
    curators.length === 1 ? curators[0]!.id : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createCaseAction({
        storyId,
        assignedCuratorId: selectedCuratorId || undefined,
      });
      if (result.success) {
        router.push(`/admin/casos/${result.caseId}`);
      } else {
        setError(result.error);
      }
    });
  }

  if (curators.length === 0) {
    return (
      <div className="max-w-sm space-y-2 rounded-md border border-border-strong bg-recessed p-3">
        <p className="text-sm font-medium text-ink">
          Falta habilitar um Curador Médico
        </p>
        <p className="text-xs leading-relaxed text-ink-muted">
          O caso não será aberto sem alguém capaz de recebê-lo. Conceda o papel
          e volte a esta história.
        </p>
        <Link
          href="/admin/equipe"
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-surface hover:bg-brand-primary-deep"
        >
          Habilitar curador na equipe
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2 sm:w-auto">
      <label
        htmlFor={`curador-${storyId}`}
        className="text-xs font-medium text-ink-muted"
      >
        Destino inicial
      </label>
      <Select
        id={`curador-${storyId}`}
        value={selectedCuratorId}
        disabled={isPending}
        onChange={(event) => setSelectedCuratorId(event.target.value)}
      >
        {curators.length > 1 ? (
          <option value="">Fila compartilhada de Curadoria</option>
        ) : null}
        {curators.map((curator) => (
          <option key={curator.id} value={curator.id}>
            {curator.name}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        isLoading={isPending}
        onClick={handleClick}
      >
        Iniciar caso
      </Button>
      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
