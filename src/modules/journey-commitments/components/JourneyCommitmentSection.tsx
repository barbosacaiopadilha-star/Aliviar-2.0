"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Profile } from "@/lib/types/database";
import type { JourneyCommitmentWithAssignee } from "@/modules/journey-commitments/types/commitment";
import { createCommitmentAction } from "@/modules/journey-commitments/actions/commitments";
import { JourneyCommitmentForm } from "@/modules/journey-commitments/components/JourneyCommitmentForm";
import { JourneyCommitmentList } from "@/modules/journey-commitments/components/JourneyCommitmentList";

export function JourneyCommitmentSection({
  journeyId,
  commitments,
  staff,
  canAdd,
}: {
  journeyId: string;
  commitments: JourneyCommitmentWithAssignee[];
  staff: Profile[];
  canAdd: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
    setShowForm(false);
  }, [router]);

  const createAction = useMemo(
    () => createCommitmentAction.bind(null, journeyId),
    [journeyId],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink">Compromissos</h2>
        {canAdd && staff.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary"
          >
            {showForm ? "Fechar formulário" : "Adicionar compromisso"}
          </button>
        )}
      </div>

      {!canAdd && (
        <p className="text-sm text-ink-soft">
          Jornadas encerradas ou canceladas não recebem novos compromissos.
        </p>
      )}

      {showForm && canAdd && (
        <JourneyCommitmentForm
          journeyId={journeyId}
          staff={staff}
          action={createAction}
          onSuccess={refresh}
        />
      )}

      <JourneyCommitmentList commitments={commitments} journeyId={journeyId} />
    </section>
  );
}
