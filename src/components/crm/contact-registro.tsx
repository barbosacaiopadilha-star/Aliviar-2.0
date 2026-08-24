"use client";

import { useState, useTransition } from "react";

import { StatusBanner } from "@/components/ads";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentAction,
  createInteractionAction,
  createTaskAction,
  updateTaskStatusAction,
} from "@/modules/crm/actions";
import {
  INTERACTION_TYPE_LABELS,
  TASK_STATUS_LABELS,
  type CrmAppointmentSummary,
  type CrmTaskSummary,
  type CrmTimelineEntry,
} from "@/modules/crm/types";

/**
 * O REGISTRO do contato — a metade viva que a ficha CRM tinha e a fusão
 * fila×contatos (21/08) trouxe para a ficha única do Atendimento: registrar
 * uma interação, criar e concluir tarefa, agendar compromisso, e a linha do
 * tempo. O que morreu com a ficha antiga morreu por ser máquina duplicada
 * (o seletor manual de etapa do funil e a "Transferência COA" — o
 * encaminhamento real é o do Case, que vive na jornada acima) ou vitrine
 * vazia (o cartão de WhatsApp sem integração).
 */

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

type ContactRegistroProps = {
  contactId: string;
  caseId: string | null;
  tasks: CrmTaskSummary[];
  appointments: CrmAppointmentSummary[];
  timeline: CrmTimelineEntry[];
};

export function ContactRegistro({ contactId, caseId, tasks, appointments, timeline }: ContactRegistroProps) {
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
    <div className="space-y-4">
      {message ? (
        <StatusBanner variant={message.includes("sucesso") ? "success" : "error"}>{message}</StatusBanner>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">Registro</h2>
        </CardHeader>
        <div className="space-y-4">
          <QuickInteractionForm contactId={contactId} caseId={caseId} onSubmit={runAction} isPending={isPending} />
          <QuickTaskForm contactId={contactId} caseId={caseId} onSubmit={runAction} isPending={isPending} />
          <QuickAppointmentForm contactId={contactId} caseId={caseId} onSubmit={runAction} isPending={isPending} />
        </div>
      </Card>

      {/* 2ª passada de 24/08 (auditoria do Fundador) · Tarefas e Agenda
          recolhem: a ADR-075 garantiu que os atos comerciais VIVEM na ficha,
          e continuam vivendo — mas numa operação que combina tudo pelo
          WhatsApp, duas listas abertas em toda visita eram o mesmo cockpit
          vazio que saiu do dashboard. Título à vista, conteúdo a um clique. */}
      <Card>
        <details>
          <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <h2 className="font-sans text-lg font-semibold text-ink">
              Tarefas{tasks.length > 0 ? ` · ${tasks.length}` : ""}
            </h2>
          </summary>
        <ul className="mt-3 divide-y divide-border">
          {tasks.length === 0 ? (
            <li className="py-3 text-sm text-ink-muted">Nenhuma tarefa registrada.</li>
          ) : (
            tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="text-ink-muted">{TASK_STATUS_LABELS[task.status] ?? task.status} · {formatDateTime(task.dueAt)}</p>
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
        </details>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <h2 className="font-sans text-lg font-semibold text-ink">
              Agenda{appointments.length > 0 ? ` · ${appointments.length}` : ""}
            </h2>
          </summary>
          <ul className="mt-3 divide-y divide-border">
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
        </details>
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
                    <p className="font-medium text-ink">{INTERACTION_TYPE_LABELS[entry.interaction.type] ?? entry.interaction.type}</p>
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
