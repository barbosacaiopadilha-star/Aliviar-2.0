"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transferToConciergeAction, transferToCuradoriaAction } from "@/modules/coa/actions";
import { ATENDIMENTO_PIPELINE_STAGES, CURADORIA_PIPELINE_STAGES } from "@/modules/coa/levels";
import type { PipelineStage } from "@/modules/crm/pipeline";

type TeamOption = {
  id: string;
  name: string;
};

type CoaTransferPanelProps = {
  contactId: string;
  caseId: string | null;
  pipelineStage: PipelineStage;
  curators: TeamOption[];
  concierges: TeamOption[];
  onTransfer: (action: () => Promise<{ success: boolean; error?: string }>) => void;
  isPending: boolean;
};

export function CoaTransferPanel({
  contactId,
  caseId,
  pipelineStage,
  curators,
  concierges,
  onTransfer,
  isPending,
}: CoaTransferPanelProps) {
  const [curatorId, setCuratorId] = useState("");
  const [conciergeId, setConciergeId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const canSendToCuradoria = ATENDIMENTO_PIPELINE_STAGES.includes(pipelineStage);
  const canSendToConcierge = CURADORIA_PIPELINE_STAGES.includes(pipelineStage);

  if (!canSendToCuradoria && !canSendToConcierge) return null;

  const selectedCurator = curators.find((member) => member.id === curatorId);
  const selectedConcierge = concierges.find((member) => member.id === conciergeId);

  return (
    <div className="space-y-4 rounded-sm border border-border bg-canvas p-4">
      <div>
        <h3 className="font-sans text-sm font-semibold text-ink">Transferência COA</h3>
        <p className="text-xs text-ink-muted">
          Registra origem, destino, responsável e auditoria. O Assistido mantém o mesmo WhatsApp.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor="coa-transfer-reason">
          Motivo
        </label>
        <Textarea
          id="coa-transfer-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: Consulta inicial concluída, pronto para Curadoria."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor="coa-transfer-notes">
          Observações
        </label>
        <Textarea
          id="coa-transfer-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      {canSendToCuradoria ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="coa-curator">
              Curador responsável
            </label>
            <Select id="coa-curator" value={curatorId} onChange={(e) => setCuratorId(e.target.value)}>
              <option value="">Selecionar curador…</option>
              {curators.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={isPending || !curatorId || !reason.trim()}
            onClick={() =>
              onTransfer(() =>
                transferToCuradoriaAction({
                  contactId,
                  caseId: caseId ?? undefined,
                  curatorId,
                  curatorName: selectedCurator?.name ?? "",
                  reason: reason.trim(),
                  notes: notes.trim() || undefined,
                }),
              )
            }
          >
            Enviar para Curadoria
          </Button>
        </div>
      ) : null}

      {canSendToConcierge ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-ink" htmlFor="coa-concierge">
              Concierge responsável
            </label>
            <Select id="coa-concierge" value={conciergeId} onChange={(e) => setConciergeId(e.target.value)}>
              <option value="">Selecionar concierge…</option>
              {concierges.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={isPending || !conciergeId || !reason.trim()}
            onClick={() =>
              onTransfer(() =>
                transferToConciergeAction({
                  contactId,
                  caseId: caseId ?? undefined,
                  conciergeId,
                  conciergeName: selectedConcierge?.name ?? "",
                  reason: reason.trim(),
                  notes: notes.trim() || undefined,
                }),
              )
            }
          >
            Transferir para Concierge
          </Button>
        </div>
      ) : null}
    </div>
  );
}
