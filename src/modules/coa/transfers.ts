import type { SupabaseClient } from "@supabase/supabase-js";

import {
  changePipelineStage,
  createInteraction,
  getContactById,
  writeCrmAudit,
} from "@/modules/crm/repository";
import type { PipelineStage } from "@/modules/crm/pipeline";

import type { CoaLevel, CoaTransferRecord } from "./types";
import { COA_LEVEL_LABELS } from "./types";

export type RecordCoaTransferInput = {
  contactId: string;
  caseId?: string;
  from: CoaLevel;
  to: CoaLevel;
  toStage: PipelineStage;
  reason: string;
  notes?: string;
  responsibleId?: string;
  responsibleName?: string;
};

function transferPayload(input: RecordCoaTransferInput): CoaTransferRecord {
  return {
    origin: input.from,
    destination: input.to,
    responsibleId: input.responsibleId ?? "",
    responsibleName: input.responsibleName ?? "",
    responsibleRole:
      input.to === "CURADORIA" ? "curador" : input.to === "CONCIERGE" ? "concierge" : "atendente",
    transferredAt: new Date().toISOString(),
    reason: input.reason,
    notes: input.notes,
  };
}

export async function recordCoaTransfer(
  supabase: SupabaseClient,
  input: RecordCoaTransferInput,
  actorId: string,
  roles: string[],
  options?: { skipStageChange?: boolean },
): Promise<CoaTransferRecord> {
  const contact = await getContactById(supabase, input.contactId);
  if (!contact) throw new Error("Contato não encontrado.");

  const payload = transferPayload(input);

  if (!options?.skipStageChange) {
    await changePipelineStage(
      supabase,
      {
        contactId: input.contactId,
        caseId: input.caseId ?? contact.activeCaseId ?? undefined,
        toStage: input.toStage,
        reason: input.reason,
      },
      actorId,
      roles,
    );
  }

  if (input.caseId ?? contact.activeCaseId) {
    const caseId = input.caseId ?? contact.activeCaseId!;
    if (input.to === "CURADORIA" && input.responsibleId) {
      await supabase
        .from("crm_cases")
        .update({ responsible_curator_id: input.responsibleId })
        .eq("id", caseId);
    }
    if (input.to === "CONCIERGE" && input.responsibleId) {
      await supabase
        .from("crm_cases")
        .update({ responsible_concierge_id: input.responsibleId })
        .eq("id", caseId);
    }
  }

  await createInteraction(
    supabase,
    {
      contactId: input.contactId,
      caseId: input.caseId ?? contact.activeCaseId ?? undefined,
      type: "atualizacao_status",
      channel: "interno",
      direction: "interno",
      subject: `Transferência COA: ${COA_LEVEL_LABELS[input.from]} → ${COA_LEVEL_LABELS[input.to]}`,
      content: JSON.stringify(payload),
      visibility: "operacional",
    },
    actorId,
  );

  await writeCrmAudit(supabase, {
    actorId,
    action: "coa_transfer",
    entityType: "crm_contact",
    entityId: input.contactId,
    newValues: payload as unknown as Record<string, unknown>,
  });

  return payload;
}
