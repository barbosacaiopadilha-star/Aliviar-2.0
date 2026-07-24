"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { DataToolbar, StatusBanner } from "@/components/ads";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { changePipelineStageAction } from "@/modules/crm/actions";
import { isOverdue } from "@/modules/crm/next-action";
import { formatPhoneDisplay } from "@/modules/crm/phone";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES, type PipelineStage } from "@/modules/crm/pipeline";
import { CONTACT_SOURCE_LABELS, type CrmContactSummary } from "@/modules/crm/types";

import { CrmStageBadge } from "./crm-stage-badge";

type CrmFunnelBoardProps = {
  contacts: CrmContactSummary[];
};

export function CrmFunnelBoard({ contacts }: CrmFunnelBoardProps) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const contact of contacts) {
      if (contact.assignedTo && contact.assignedToName) {
        map.set(contact.assignedTo, contact.assignedToName);
      }
    }
    return Array.from(map.entries());
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const haystack = `${contact.fullName} ${contact.phone ?? ""} ${contact.email ?? ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (source && contact.source !== source) return false;
      if (assignee && contact.assignedTo !== assignee) return false;
      if (priority && contact.priority !== priority) return false;
      return true;
    });
  }, [contacts, search, source, assignee, priority]);

  const byStage = useMemo(() => {
    const grouped = new Map<PipelineStage, CrmContactSummary[]>();
    for (const stage of PIPELINE_STAGES) grouped.set(stage, []);
    for (const contact of filtered) {
      grouped.get(contact.pipelineStage)?.push(contact);
    }
    return grouped;
  }, [filtered]);

  function moveStage(contactId: string, toStage: PipelineStage) {
    setPendingId(contactId);
    setMessage(null);
    startTransition(async () => {
      const result = await changePipelineStageAction({
        contactId,
        toStage,
        explicitCompletionConfirmed: toStage === "completed",
      });
      setPendingId(null);
      setMessage(result.success ? "Etapa atualizada." : result.error);
    });
  }

  return (
    <div className="space-y-4">
      <DataToolbar
        search={<Input label="Buscar" hideLabel placeholder="Buscar nome, telefone ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />}
        filters={
          <>
            <Select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filtrar por origem">
              <option value="">Todas as origens</option>
              {Object.entries(CONTACT_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filtrar por responsável">
              <option value="">Todos os responsáveis</option>
              {assignees.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filtrar por prioridade">
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </>
        }
      />

      {message ? <StatusBanner variant={message.includes("atualizada") ? "success" : "error"}>{message}</StatusBanner> : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.filter((stage) => !["archived", "lost"].includes(stage)).map((stage) => {
          const cards = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="min-w-[280px] flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{PIPELINE_STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-ink-muted">{cards.length}</span>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <Card padding="sm" className="bg-canvas/60">
                    <p className="text-xs text-ink-muted">Nenhum contato nesta etapa.</p>
                  </Card>
                ) : (
                  cards.map((contact) => (
                    <Card key={contact.id} padding="sm" className={isOverdue(contact.nextActionAt) ? "border-error/40" : ""}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/admin/crm/contatos/${contact.id}`} className="font-medium text-ink hover:text-brand-primary">
                            {contact.fullName}
                          </Link>
                          {!contact.assignedTo ? (
                            <span className="text-[10px] font-medium uppercase text-warning">Sem responsável</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-ink-muted">{CONTACT_SOURCE_LABELS[contact.source]}</p>
                        <p className="text-xs text-ink-muted">{formatPhoneDisplay(contact.phoneNormalized)}</p>
                        <p className="text-xs text-ink-muted">
                          Responsável: {contact.assignedToName ?? "—"}
                        </p>
                        <CrmStageBadge stage={contact.pipelineStage} />
                        <Select
                          aria-label={`Mover ${contact.fullName} de etapa`}
                          defaultValue=""
                          disabled={isPending && pendingId === contact.id}
                          onChange={(e) => {
                            const value = e.target.value as PipelineStage;
                            if (value) moveStage(contact.id, value);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Mover etapa…</option>
                          {PIPELINE_STAGES.filter((s) => s !== contact.pipelineStage).map((option) => (
                            <option key={option} value={option}>
                              {PIPELINE_STAGE_LABELS[option]}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum contato encontrado" description="Ajuste os filtros ou cadastre um novo contato." />
      ) : null}
    </div>
  );
}
