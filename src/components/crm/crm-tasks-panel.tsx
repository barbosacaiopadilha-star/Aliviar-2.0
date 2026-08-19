"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { StatusBanner } from "@/components/ads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateTaskStatusAction } from "@/modules/crm/actions";
import { isOverdue } from "@/modules/crm/next-action";
import type { CrmTaskSummary } from "@/modules/crm/types";

export function CrmTasksPanel({ tasks, currentUserId, isAdmin }: { tasks: CrmTaskSummary[]; currentUserId: string; isAdmin: boolean }) {
  const [filter, setFilter] = useState<"mine" | "today" | "overdue" | "future" | "done" | "team">("mine");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  // A action já devolvia `{ success, error }` e o retorno era descartado: numa
  // recusa, a tarefa continuava na tela como pendente e o operador só podia
  // supor que o clique não pegou. O erro agora é dito.
  const [erro, setErro] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return tasks.filter((task) => {
      if (filter === "mine" && task.assignedTo !== currentUserId) return false;
      if (filter === "team" && !isAdmin) return false;
      if (filter === "done" && task.status !== "concluida") return false;
      if (filter === "overdue" && (task.status === "concluida" || task.status === "cancelada" || !isOverdue(task.dueAt))) return false;
      if (filter === "today") {
        if (!task.dueAt) return false;
        const due = new Date(task.dueAt);
        if (due < start || due > end) return false;
      }
      if (filter === "future" && (!task.dueAt || new Date(task.dueAt) <= end)) return false;
      if (search && !`${task.title} ${task.contactName}`.toLowerCase().includes(search.toLowerCase())) return false;
      return task.status !== "cancelada";
    });
  }, [tasks, filter, search, currentUserId, isAdmin]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          ["mine", "Minhas tarefas"],
          ["today", "Vencendo hoje"],
          ["overdue", "Atrasadas"],
          ["future", "Futuras"],
          ["done", "Concluídas"],
          ...(isAdmin ? [["team", "Equipe"] as const] : []),
        ].map(([value, label]) => (
          <Button key={value} size="sm" variant={filter === value ? "primary" : "secondary"} onClick={() => setFilter(value as typeof filter)}>
            {label}
          </Button>
        ))}
      </div>
      <Input label="Buscar tarefas" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título ou contato" />
      {erro ? <StatusBanner variant="error">{erro}</StatusBanner> : null}
      <div className="space-y-3">
        {filtered.map((task) => (
          <Card key={task.id} padding="sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{task.title}</p>
                <p className="text-sm text-ink-muted">
                  <Link href={`/admin/crm/contatos/${task.contactId}`} className="text-brand-primary hover:text-brand-primary-deep">
                    {task.contactName}
                  </Link>
                  {" · "}
                  {task.dueAt ?? "Sem prazo"}
                </p>
              </div>
              {task.status !== "concluida" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      setErro(null);
                      const resultado = await updateTaskStatusAction({
                        taskId: task.id,
                        status: "concluida",
                      });
                      if (!resultado.success) {
                        setErro(resultado.error ?? "Não foi possível concluir a tarefa.");
                      }
                    })
                  }
                >
                  Concluir
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
