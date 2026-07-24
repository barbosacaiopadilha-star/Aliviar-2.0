"use client";

import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/ads";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  changePipelineStageAction,
  createAppointmentAction,
  createInteractionAction,
  createTaskAction,
  updateTaskStatusAction,
} from "@/modules/crm/actions";
import { formatPhoneDisplay } from "@/modules/crm/phone";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/modules/crm/pipeline";
import type {
  CrmAppointmentSummary,
  CrmCaseSummary,
  CrmContactDetail,
  CrmInteraction,
  CrmTaskSummary,
  CrmTimelineEntry,
} from "@/modules/crm/types";

import { CrmStageBadge } from "./crm-stage-badge";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

type CrmContactDetailPanelProps = {
  contact: CrmContactDetail;
  cases: CrmCaseSummary[];
  interactions: CrmInteraction[];
  tasks: CrmTaskSummary[];
  appointments: CrmAppointmentSummary[];
  timeline: CrmTimelineEntry[];
  allowedStages: PipelineStage[];
};

export function CrmContactDetailPanel({
  contact,
  cases,
  tasks,
  appointments,
  timeline,
  allowedStages,
}: CrmContactDetailPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.success ? "Salvo com sucesso." : result.error ?? "Não foi possível concluir a ação.");
    });
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">{formatPhoneDisplay(contact.phoneNormalized)} · {contact.email ?? "Sem e-mail"}</p>
            <CrmStageBadge stage={contact.pipelineStage} />
            <p className="text-sm text-ink-muted">Responsável: {contact.assignedToName ?? "Sem responsável"}</p>
            <p className="text-sm text-ink-muted">Consentimento: {contact.consentStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Mudar etapa"
              defaultValue=""
              onChange={(e) => {
                const toStage = e.target.value as PipelineStage;
                if (!toStage) return;
                runAction(() =>
                  changePipelineStageAction({
                    contactId: contact.id,
                    toStage,
                    explicitCompletionConfirmed: toStage === "completed",
                  }),
                );
              }}
            >
              <option value="">Mudar etapa…</option>
              {allowedStages.map((stage) => (
                <option key={stage} value={stage}>
                  {PIPELINE_STAGE_LABELS[stage]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {message ? (
        <StatusBanner variant={message.includes("sucesso") ? "success" : "error"}>{message}</StatusBanner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Resumo operacional</h2>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-ink-muted">Motivo inicial</dt><dd>{contact.initialReason ?? "—"}</dd></div>
            <div><dt className="text-ink-muted">Cidade</dt><dd>{contact.city ? `${contact.city}/${contact.state ?? ""}` : "—"}</dd></div>
            <div><dt className="text-ink-muted">Última interação</dt><dd>{formatDateTime(contact.lastInteractionAt)}</dd></div>
            <div><dt className="text-ink-muted">Próxima ação</dt><dd>{formatDateTime(contact.nextActionAt)}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Ações rápidas</h2>
          </CardHeader>
          <div className="space-y-4">
            <QuickInteractionForm contactId={contact.id} caseId={contact.activeCaseId} onSubmit={runAction} isPending={isPending} />
            <QuickTaskForm contactId={contact.id} caseId={contact.activeCaseId} onSubmit={runAction} isPending={isPending} />
            <QuickAppointmentForm contactId={contact.id} caseId={contact.activeCaseId} onSubmit={runAction} isPending={isPending} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Tarefas</h2>
        </CardHeader>
        <ul className="divide-y divide-border">
          {tasks.length === 0 ? (
            <li className="py-3 text-sm text-ink-muted">Nenhuma tarefa registrada.</li>
          ) : (
            tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">{task.title}</p>
                <p className="text-ink-muted">{task.status} · {formatDateTime(task.dueAt)}</p>
              </div>
              {task.status !== "concluida" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => runAction(() => updateTaskStatusAction({ taskId: task.id, status: "concluida" }))}
                >
                  Concluir
                </Button>
              ) : null}
            </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Agenda</h2>
        </CardHeader>
        <ul className="divide-y divide-border">
          {appointments.length === 0 ? (
            <li className="py-3 text-sm text-ink-muted">Nenhum compromisso agendado.</li>
          ) : (
            appointments.map((appointment) => (
            <li key={appointment.id} className="py-3 text-sm">
              <p className="font-medium text-ink">{appointment.title}</p>
              <p className="text-ink-muted">{formatDateTime(appointment.startAt)} · {appointment.status}</p>
            </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Linha do tempo</h2>
        </CardHeader>
        <ul className="space-y-3">
          {timeline.length === 0 ? (
            <li className="text-sm text-ink-muted">Nenhum evento na linha do tempo.</li>
          ) : (
            timeline.map((entry, index) => (
            <li key={`${entry.kind}-${index}`} className="rounded-sm border border-border p-3 text-sm">
              {entry.kind === "interaction" ? (
                <>
                  <p className="font-medium text-ink">{entry.interaction.type}</p>
                  <p className="text-ink-muted">{entry.interaction.content}</p>
                </>
              ) : entry.kind === "task_completed" ? (
                <p>Tarefa concluída: {entry.task.title}</p>
              ) : entry.kind === "appointment" ? (
                <p>Compromisso: {entry.appointment.title}</p>
              ) : entry.kind === "stage_change" ? (
                <p>Mudança de etapa registrada</p>
              ) : (
                <p>Evento de auditoria</p>
              )}
              <p className="mt-1 text-xs text-ink-muted">{formatDateTime(entry.at)}</p>
            </li>
            ))
          )}
        </ul>
      </Card>

      {cases.length > 1 ? (
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Casos</h2>
          </CardHeader>
          <ul className="space-y-2 text-sm">
            {cases.map((crmCase) => (
              <li key={crmCase.id}>
                {crmCase.title} · <CrmStageBadge stage={crmCase.pipelineStage} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">WhatsApp</h2>
          <p className="text-sm text-ink-muted">Integração não configurada. Nenhuma mensagem sincronizada.</p>
        </CardHeader>
      </Card>
    </div>
  );
}

function QuickInteractionForm({
  contactId,
  caseId,
  onSubmit,
  isPending,
}: {
  contactId: string;
  caseId: string | null;
  onSubmit: (action: () => Promise<{ success: boolean; error?: string }>) => void;
  isPending: boolean;
}) {
  const [content, setContent] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(() =>
          createInteractionAction({
            contactId,
            caseId: caseId ?? undefined,
            type: "anotacao_interna",
            channel: "interno",
            direction: "interno",
            content,
          }),
        );
        setContent("");
      }}
    >
      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="interaction-content">
        Registrar interação
      </label>
      <Textarea id="interaction-content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
      <Button size="sm" type="submit" disabled={isPending || !content.trim()}>
        Registrar
      </Button>
    </form>
  );
}

function QuickTaskForm({
  contactId,
  caseId,
  onSubmit,
  isPending,
}: {
  contactId: string;
  caseId: string | null;
  onSubmit: (action: () => Promise<{ success: boolean; error?: string }>) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(() =>
          createTaskAction({
            contactId,
            caseId: caseId ?? undefined,
            title,
            type: "retorno",
          }),
        );
        setTitle("");
      }}
    >
      <label className="block text-sm font-medium text-ink" htmlFor="quick-task">
        Nova tarefa
      </label>
      <input
        id="quick-task"
        className="block w-full rounded-sm border border-border px-3 py-2 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button size="sm" type="submit" disabled={isPending || !title.trim()}>
        Criar tarefa
      </Button>
    </form>
  );
}

function QuickAppointmentForm({
  contactId,
  caseId,
  onSubmit,
  isPending,
}: {
  contactId: string;
  caseId: string | null;
  onSubmit: (action: () => Promise<{ success: boolean; error?: string }>) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("Consulta Inicial");
  const [startAt, setStartAt] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(() =>
          createAppointmentAction({
            contactId,
            caseId: caseId ?? undefined,
            title,
            startAt: new Date(startAt).toISOString(),
            type: "consulta_inicial",
          }),
        );
      }}
    >
      <label className="block text-sm font-medium text-ink" htmlFor="quick-appointment-title">
        Agendar compromisso
      </label>
      <input
        id="quick-appointment-title"
        className="block w-full rounded-sm border border-border px-3 py-2 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="datetime-local"
        className="block w-full rounded-sm border border-border px-3 py-2 text-sm"
        value={startAt}
        onChange={(e) => setStartAt(e.target.value)}
      />
      <Button size="sm" type="submit" disabled={isPending || !startAt}>
        Agendar
      </Button>
    </form>
  );
}
